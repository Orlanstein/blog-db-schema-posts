const { EmailClient } = require("@azure/communication-email");

const connectionString = "endpoint=https://emailzombies.unitedstates.communication.azure.com/;accesskey=7gyKQAeivIv5t2gUx81H0Q1x9WctJ1F6rRTDaScCFLjcWplJJGwIJQQJ99ALACULyCpREAbvAAAAAZCSVmqK";
const client = new EmailClient(connectionString);

async function main() {
    const emailMessage = {
        senderAddress: "DoNotReply@474091f1-9c56-41ae-83b0-83cb4ecbf7d0.azurecomm.net",
        content: {
            subject: "Hola peter",
            plainText: "Hola desde azure",
            html: `
			<html>
				<body>
					<h1>Hola desde azure</h1>
				</body>
			</html>`,
        },
        recipients: {
            to: [{ address: "petercechcrak@gmail.com" }],
        },
        
    };

    const poller = await client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();
}

main();