const removeUserFromGroup = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Group Removal Notification</title>
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
            <h1>Group Membership Update</h1>
            <p>Dear {{username}},</p>
            <p>We regret to inform you that you have been removed from the group, <strong>{{group}}</strong>, by the group owner.</p>
            <p>If you have any questions or need further information regarding this decision, please feel free to reach out to our support team.</p>
            <p>Thank you for your understanding.</p>
        </div>
        <div class="footer">
            <p>If you have any questions, don't contact us =))).</p>
            <p>Best regards,<br>The {{siteConfigName}} Team</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = removeUserFromGroup;
