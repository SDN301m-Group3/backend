const userGroupUpdateTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Group Update Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 10px 0;
        }
        .header img {
            width: 100%;
        }
        .content {
            margin: 20px 0;
        }
        .content h1 {
            font-size: 24px;
            color: #333333;
        }
        .content p {
            font-size: 16px;
            color: #555555;
        }
        .button-container {
            text-align: center;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 4px;
            background-color: #007bff;
            color: white!important;
            text-decoration: none;
            font-weight: bold;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .footer {
            text-align: center;
            padding: 10px 0;
            font-size: 12px;
            color: #999999;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{groupImg}}" alt="Group Image">
        </div>
        <div class="content">
            <h1>Group Update Notification</h1>
            <p>Dear {{username}},</p>
            <p>We wanted to let you know that the group, <strong>{{groupTitle}}</strong>, has been updated by the owner.</p>
            <p>To view the changes, please visit the group page by clicking the button below:</p>
            <div class="button-container">
                <a href="{{redirectUrl}}" class="button">View Group</a>
            </div>
            <p>If you have any questions or need further assistance, please do not hesitate to contact our support team.</p>
            <p>Thank you for your attention.</p>
        </div>
        <div class="footer">
            <p>If you have any questions, don't contact us =))).</p>
            <p>Best regards,<br>The {{siteConfigName}} Team</p>
        </div>
    </div>
</body>
</html>

`;

module.exports = userGroupUpdateTemplate;
