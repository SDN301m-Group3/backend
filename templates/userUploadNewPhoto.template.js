const userUploadNewPhoto = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Photo Uploaded</title>
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
        .photo-preview {
            text-align: center;
            margin: 20px 0;
        }
        .photo-preview img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
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
            <img src="{{photoUrl}}" alt="Photo">
        </div>
        <div class="content">
            <h1>New Photo Uploaded to Album</h1>
            <p>Hello {{username}},</p>
            <p>We are excited to inform you that {{uploadUsername}} has uploaded a new photo to the album, <strong>{{albumTitle}}</strong>.</p>
            <p>Click the button below to view the new photo:</p>
            <div class="btn-container">
                <a href="{{redirectUrl}}" class="btn">View Photo</a>
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

module.exports = userUploadNewPhoto;
