
import fs from 'fs-extra';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';

// ESM dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'cursor-extension');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SECURE_DIR = path.join(DIST_DIR, 'cursor-extension-secure');
const VERSION = '1.0.0';

// Configuration
// CHANGE THIS URL to your actual endpoint where updates.xml will be hosted
const UPDATE_URL_BASE = 'https://snippymart.com/extension';
const UPDATE_XML_URL = `${UPDATE_URL_BASE}/updates.xml`;

async function build() {
    console.log('🔒 Starting Secure Extension Build...');

    // 1. Clean & Setup
    if (fs.existsSync(DIST_DIR)) {
        fs.removeSync(SECURE_DIR); // Remove only the secure dir, keep others if needed
    }
    fs.ensureDirSync(SECURE_DIR);

    // 2. Copy Static Assets (Manifest, HTML, CSS, Images)
    console.log('📂 Copying assets...');
    fs.copySync(SOURCE_DIR, SECURE_DIR, {
        filter: (src) => !src.endsWith('.js') // Don't copy raw JS, we process it later
    });

    // 3. Obfuscate & Copy JS
    console.log('🛡️  Obfuscating JavaScript...');
    const jsFiles = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.js'));

    for (const file of jsFiles) {
        const filePath = path.join(SOURCE_DIR, file);
        const code = fs.readFileSync(filePath, 'utf8');

        // Heavy Obfuscation Settings
        const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 1,
            disableConsoleOutput: true, // No logs for users
            selfDefending: true, // Makes it harder to debug
            rotateStringArray: true,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            identifiersDictionary: [],
            renameGlobals: false, // Keep browser globals (chrome, document, etc)
        });

        fs.writeFileSync(path.join(SECURE_DIR, file), obfuscationResult.getObfuscatedCode());
        console.log(`   - Protected: ${file}`);
    }

    // 4. Inject Update URL into Manifest
    console.log('📝 Updating Manifest...');
    const manifestPath = path.join(SECURE_DIR, 'manifest.json');
    const manifest = fs.readJsonSync(manifestPath);

    // Add update_url for auto-updates
    manifest.update_url = UPDATE_XML_URL;

    fs.writeJsonSync(manifestPath, manifest, { spaces: 0 }); // Minified manifest

    // 5. Generate updates.xml
    console.log('📡 Generating updates.xml...');
    const crxUrl = `${UPDATE_URL_BASE}/cursor-smart-recovery-v${VERSION}.crx`; // Chrome Store or Self-Hosted CRX
    // Note: For self-hosted zip, we usually point to a CRX. Chrome requires CRX for auto-updates.
    // For this build, we are just generating the XML structure.

    const updatesXml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${generateAppId()}' status='ok'>
    <updatecheck codebase='${crxUrl}' version='${VERSION}' />
  </app>
</gupdate>`;

    fs.writeFileSync(path.join(DIST_DIR, 'updates.xml'), updatesXml);

    // 6. Zip It
    console.log('📦 Zipping final artifact...');
    const zip = new AdmZip();
    zip.addLocalFolder(SECURE_DIR);
    const zipName = `cursor-smart-recovery-v${VERSION}-secure.zip`;
    zip.writeZip(path.join(DIST_DIR, zipName));

    console.log('✅ Build Complete!');
    console.log(`   - Secure Code: ${SECURE_DIR}`);
    console.log(`   - Distribution Zip: ${path.join(DIST_DIR, zipName)}`);
    console.log(`   - Update XML: ${path.join(DIST_DIR, 'updates.xml')}`);
}

// Pseudo-random ID generator (Updates require a fixed ID, usually from key.pem)
// For now we use a placeholder or you must use your actual Chrome Extension ID.
function generateAppId() {
    return "YOUR_EXTENSION_ID_HERE";
}

build().catch(console.error);
