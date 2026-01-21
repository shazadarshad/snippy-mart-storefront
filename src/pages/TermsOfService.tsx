import PolicyLayout from '@/components/layout/PolicyLayout';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
    return (
        <PolicyLayout
            title="Terms of"
            highlightedWord="Service"
            description="Read the Terms and Conditions for using Snippy Mart services. By accessing our website, you agree to these terms."
        >
            <h2>1. Terms</h2>
            <p>
                By accessing this Website, accessible from https://snippymart.vercel.app/, you are agreeing to be bound by these Website Terms and Conditions of Use and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site. The materials contained in this Website are protected by copyright and trade mark law.
            </p>

            <h2>2. Use License</h2>
            <p>
                Permission is granted to temporarily download one copy of the materials on Snippy Mart's Website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
                <li>modify or copy the materials;</li>
                <li>use the materials for any commercial purpose or for any public display;</li>
                <li>attempt to reverse engineer any software contained on Snippy Mart's Website;</li>
                <li>remove any copyright or other proprietary notations from the materials; or</li>
                <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>
            <p>
                This will let Snippy Mart to terminate upon violations of any of these restrictions. Upon termination, your viewing right will also be terminated and you should destroy any downloaded materials in your possession whether it is printed or electronic format.
            </p>

            <h2>3. Disclaimer</h2>
            <p>
                All the materials on Snippy Mart's Website are provided "as is". Snippy Mart makes no warranties, may it be expressed or implied, therefore negates all other warranties. Furthermore, Snippy Mart does not make any representations concerning the accuracy or likely results of the use of the materials on its Website or otherwise relating to such materials or on any sites linked to this Website.
            </p>

            <h2>4. Limitations</h2>
            <p>
                Snippy Mart or its suppliers will not be hold accountable for any damages that will arise with the use or inability to use the materials on Snippy Mart's Website, even if Snippy Mart or an authorize representative of this Website has been notified, orally or written, of the possibility of such damage. Some jurisdiction does not allow limitations on implied warranties or limitations of liability for incidental damages, these limitations may not apply to you.
            </p>

            <h2>5. Revisions and Errata</h2>
            <p>
                The materials appearing on Snippy Mart's Website may include technical, typographical, or photographic errors. Snippy Mart will not promise that any of the materials in this Website are accurate, complete, or current. Snippy Mart may change the materials contained on its Website at any time without notice. Snippy Mart does not make any commitment to update the materials.
            </p>

            <h2>6. Links</h2>
            <p>
                Snippy Mart has not reviewed all of the sites linked to its Website and is not responsible for the contents of any such linked site. The presence of any link does not imply endorsement by Snippy Mart of the site. The use of any linked website is at the user's own risk.
            </p>

            <h2>7. Site Terms of Use Modifications</h2>
            <p>
                Snippy Mart may revise these Terms of Use for its Website at any time without prior notice. By using this Website, you are agreeing to be bound by the current version of these Terms and Conditions of Use.
            </p>

            <h2>8. Your Privacy</h2>
            <p>
                Please read our <Link to="/privacy-policy" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
            </p>

            <h2>9. Governing Law</h2>
            <p>
                Any claim related to Snippy Mart's Website shall be governed by the laws of Sri Lanka without regards to its conflict of law provisions.
            </p>
        </PolicyLayout>
    );
};

export default TermsOfService;
