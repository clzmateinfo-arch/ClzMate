exports.paymentSuccessEmail = (name, amount, orderId, paymentId) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Received</title>
    <style>
        body { background-color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
        .message { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
        .body { font-size: 16px; margin-bottom: 20px; }
        .highlight { font-weight: bold; }
        .support { font-size: 14px; color: #999999; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="message">Payment Received</div>
        <div class="body">
            <p>Dear ${name},</p>
            <p>We have received your payment of <span class="highlight">$${amount}</span>.</p>
            <p>Order ID: <span class="highlight">${orderId}</span></p>
            <p>Payment ID: <span class="highlight">${paymentId}</span></p>
            <p>You will be enrolled in your selected course(s) shortly.</p>
        </div>
        <div class="support">Questions? Contact us at <a href="mailto:clzmate.info@gmail.com">clzmate.info@gmail.com</a></div>
    </div>
</body>
</html>`;
};
