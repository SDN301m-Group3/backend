const likePhoto = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Comment Notification</title>
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
        .comment {
            background-color: #f9f9f9;
            padding: 10px;
            border-left: 4px solid #007bff;
            margin: 10px 0;
            border-radius: 4px;
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
            <img src="{{photoUrl}}" alt="Photo">
        </div>
        <div class="content">
            <h1>New Comment on Your Photo</h1>
            <p>Hello {{ownerUsername}},</p>
            <p>A user has commented on your photo:</p>
            <div class="comment">
                <p><strong>{{commentUsername}}:</strong> {{content}}</p>
            </div>
            <p>You can view the comment and respond by clicking the button below:</p>
            <div class="btn-container" style="text-align: center; margin: 30px 0;">
                <a href={{redirectUrl}} style="background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px;">View Comment</a>
            </div>
        </div>
        <div class="footer">
            <p>If you have any questions, don't contact us =)))).</p>
            <p>Best regards,<br>The {{siteConfigName}} Team</p>
        </div>
    </div>
</body>
</html>
`;

module.exports = likePhoto;
