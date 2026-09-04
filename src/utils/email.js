async function sendEmail(to, subject, text) {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured.');
    }

    if (!fromEmail) {
        throw new Error('EMAIL_FROM is not configured.');
    }

    const response = await fetch(
        'https://api.brevo.com/v3/smtp/email',
        {
            method: 'POST',

            headers: {
                accept: 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },

            body: JSON.stringify({
                sender: {
                    name: 'Giftora',
                    email: fromEmail
                },

                to: [
                    {
                        email: to
                    }
                ],

                subject: subject,
                textContent: text
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            'Unable to send email through Brevo.'
        );
    }

    return data;
}

module.exports = {
    sendEmail
};