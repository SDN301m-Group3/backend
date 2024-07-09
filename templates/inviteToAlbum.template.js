const inviteToAlbum = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Album Invitation</title>
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
            width: 100%;
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
        .btn-container {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            background-color: #007bff;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
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
            <img src="{{albumImg}}" alt="Album Image">
        </div>
        <div class="content">
            <h1>You're Invited!</h1>
            <p>Hello {{username}},</p>
            <p>We are excited to invite you to join our group, {{album}}. By joining, you'll be able to connect with like-minded individuals, participate in exclusive events, and much more.</p>
            <p>Click the button below to accept your invitation and become a part of our community.</p>
        </div>
        <div class="btn-container">
            <a href="{{joinLink}}" class="btn">Join Now</a>
        </div>
        <div class="footer">
            <p>If you have any questions, don't contact us =))).</p>
            <p>Best regards,<br>The {{siteConfigName}} Team</p>
        </div>
    </div>
</body>
</html>

  `;

module.exports = inviteToAlbum;
