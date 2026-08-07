package com.snippymart.admin;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Native Android Background SMS Receiver for Snippy Admin APK.
 * Runs even when the app is completely closed or screen is turned off.
 */
public class AdminSmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SnippySmsReceiver";
    private static final String SUPABASE_URL = "https://vuffzfuklzzcnfnubtzx.supabase.co";
    private static final String SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZmZ6ZnVrbHp6Y25mbnVidHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTQ1NjAsImV4cCI6MjA4NDI3MDU2MH0.qHjJYOrNi1cBYPYapmHMJgDxsI50sHAKUAvv0VnPQFM";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            return;
        }

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        try {
            Object[] pdus = (Object[]) bundle.get("pdus");
            String format = bundle.getString("format");

            if (pdus == null) return;

            for (Object pdu : pdus) {
                SmsMessage sms;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    sms = SmsMessage.createFromPdu((byte[]) pdu, format);
                } else {
                    sms = SmsMessage.createFromPdu((byte[]) pdu);
                }

                if (sms == null) continue;

                String sender = sms.getDisplayOriginatingAddress();
                String body = sms.getMessageBody();

                Log.d(TAG, "SMS Received from: " + sender);

                if (isDfAlertSender(sender, body)) {
                    processDfAlertBackgroundSms(context, sender, body);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling SMS broadcast", e);
        }
    }

    private boolean isDfAlertSender(String sender, String body) {
        if (sender != null && sender.toLowerCase().contains("df-alert")) return true;
        if (sender != null && sender.toLowerCase().contains("dfalert")) return true;
        if (body != null && body.toLowerCase().contains("df-alert")) return true;
        if (body != null && body.contains("Inward CEFTS")) return true;
        return false;
    }

    private void processDfAlertBackgroundSms(final Context context, final String sender, final String body) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    // Strip out trailing Account Balance to avoid parsing total balance
                    String cleanBody = body;
                    if (cleanBody.toLowerCase().contains("account balance")) {
                        cleanBody = cleanBody.split("(?i)account balance")[0];
                    }

                    // Extract payment amount (e.g. Inward CEFTS of LKR 499.00...)
                    Pattern pattern = Pattern.compile("(?:Inward\\s+CEFTS\\s+of\\s+)?(?:LKR|Rs\\.?|SLR)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)", Pattern.CASE_INSENSITIVE);
                    Matcher matcher = pattern.matcher(cleanBody);

                    Double amount = null;
                    while (matcher.find()) {
                        String matchStr = matcher.group(1).replace(",", "");
                        try {
                            double val = Double.parseDouble(matchStr);
                            if (val > 0) {
                                amount = val;
                                break;
                            }
                        } catch (Exception ignored) {}
                    }

                    if (amount == null || amount <= 0) {
                        Log.d(TAG, "Could not parse amount from DF-Alert SMS");
                        return;
                    }

                    Log.d(TAG, "Extracted amount: " + amount);

                    // Threshold Check (< 700 LKR)
                    if (amount >= 700.0) {
                        Log.d(TAG, "Amount " + amount + " >= 700 LKR — skipping auto approve for safety.");
                        showNotification(context, "DF-Alert Payment (LKR " + amount + ")", "Payment >= 700 LKR. Requires manual review.");
                        return;
                    }

                    // Call Supabase API to match pending order and update status to processing
                    boolean updated = autoApproveOrderOnSupabase(amount);
                    if (updated) {
                        showNotification(context, "⚡ Order Payment Confirmed!", "Auto-Approved LKR " + amount + " via DF-Alert SMS");
                    }

                } catch (Exception e) {
                    Log.e(TAG, "Background processing error", e);
                }
            }
        }).start();
    }

    private boolean autoApproveOrderOnSupabase(double amount) {
        try {
            // 1. Fetch pending orders around this price
            String endpoint = SUPABASE_URL + "/rest/v1/orders?status=eq.pending&select=id,order_number,total_amount,notes";
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("apikey", SUPABASE_ANON_KEY);
            conn.setRequestProperty("Authorization", "Bearer " + SUPABASE_ANON_KEY);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);

            int code = conn.getResponseCode();
            if (code == 200) {
                java.io.InputStream is = conn.getInputStream();
                java.util.Scanner scanner = new java.util.Scanner(is).useDelimiter("\\A");
                String responseText = scanner.hasNext() ? scanner.next() : "";
                scanner.close();

                // Simple JSON match for order id and total_amount matching amount
                if (responseText.contains("\"id\":")) {
                    // Match order where total_amount is equal
                    Pattern orderPattern = Pattern.compile("\"id\":\"([^\"]+)\"[^}]*\"total_amount\":([0-9.]+)");
                    Matcher m = orderPattern.matcher(responseText);
                    while (m.find()) {
                        String orderId = m.group(1);
                        double orderTotal = Double.parseDouble(m.group(2));

                        if (Math.abs(orderTotal - amount) < 1.0) {
                            // UPDATE ORDER to status = 'processing'
                            String updateEndpoint = SUPABASE_URL + "/rest/v1/orders?id=eq." + orderId;
                            URL updateUrl = new URL(updateEndpoint);
                            HttpURLConnection updateConn = (HttpURLConnection) updateUrl.openConnection();
                            updateConn.setRequestMethod("PATCH");
                            updateConn.setRequestProperty("apikey", SUPABASE_ANON_KEY);
                            updateConn.setRequestProperty("Authorization", "Bearer " + SUPABASE_ANON_KEY);
                            updateConn.setRequestProperty("Content-Type", "application/json");
                            updateConn.setRequestProperty("Prefer", "return=minimal");
                            updateConn.setDoOutput(true);

                            String jsonBody = "{\"status\":\"processing\",\"notes\":\"⚡ Auto-Approved via Background DF-Alert SMS (LKR " + amount + ")\"}";
                            OutputStream os = updateConn.getOutputStream();
                            os.write(jsonBody.getBytes("UTF-8"));
                            os.close();

                            int patchCode = updateConn.getResponseCode();
                            Log.d(TAG, "PATCH status response: " + patchCode);
                            return patchCode >= 200 && patchCode < 300;
                        }
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error matching order on Supabase", e);
        }
        return false;
    }

    private void showNotification(Context context, String title, String body) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            String channelId = "admin_orders";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    channelId, "Admin Order Alerts", NotificationManager.IMPORTANCE_HIGH
                );
                nm.createNotificationChannel(channel);
            }

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true);

            nm.notify((int) System.currentTimeMillis(), builder.build());
        } catch (Exception e) {
            Log.e(TAG, "Error showing notification", e);
        }
    }
}
