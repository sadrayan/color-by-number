################################################################################
# Billing alarm — alert when estimated charges exceed threshold
# Requires billing alerts to be enabled in AWS account:
# AWS Console → Billing → Billing Preferences → Receive Billing Alerts
################################################################################

variable "billing_alarm_threshold" {
  description = "Monthly estimated charge threshold in USD to trigger alarm"
  type        = number
  default     = 10
}

variable "alarm_email" {
  description = "Email address to receive billing and CloudFront alarm notifications"
  type        = string
  default     = ""
}

resource "aws_sns_topic" "alerts" {
  name = "${var.prefix}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Billing metric is only available in us-east-1
resource "aws_cloudwatch_metric_alarm" "billing" {
  provider            = aws.us_east_1
  alarm_name          = "${var.prefix}-estimated-charges"
  alarm_description   = "Alert when estimated AWS charges exceed $${var.billing_alarm_threshold}"
  namespace           = "AWS/Billing"
  metric_name         = "EstimatedCharges"
  statistic           = "Maximum"
  period              = 86400 # 24 hours
  evaluation_periods  = 1
  threshold           = var.billing_alarm_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    Currency = "USD"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# CloudFront requests alarm — spike in traffic could mean abuse
resource "aws_cloudwatch_metric_alarm" "cloudfront_requests" {
  provider            = aws.us_east_1
  alarm_name          = "${var.prefix}-cloudfront-requests"
  alarm_description   = "Alert on unusual CloudFront request volume"
  namespace           = "AWS/CloudFront"
  metric_name         = "Requests"
  statistic           = "Sum"
  period              = 3600  # 1 hour
  evaluation_periods  = 1
  threshold           = 10000 # 10k requests/hour
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.app.id
    Region         = "Global"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

################################################################################
# Outputs
################################################################################

output "sns_alerts_topic_arn" {
  description = "SNS topic ARN for alerts (subscribe additional endpoints here)"
  value       = aws_sns_topic.alerts.arn
}
