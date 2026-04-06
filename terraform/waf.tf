################################################################################
# WAF — rate limiting + managed rule groups for CloudFront
# Must be in us-east-1 for CloudFront scope
################################################################################

resource "aws_wafv2_web_acl" "cloudfront" {
  provider    = aws.us_east_1
  name        = "${var.prefix}-waf"
  scope       = "CLOUDFRONT"
  description = "WAF for ${var.prefix} CloudFront distribution"

  default_action {
    allow {}
  }

  # Block IPs exceeding 1000 requests per 5 minutes
  rule {
    name     = "rate-limit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # AWS managed rules — common threats (SQLi, XSS, bad inputs)
  rule {
    name     = "aws-managed-common-rules"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.prefix}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  # AWS managed rules — known bad inputs
  rule {
    name     = "aws-managed-known-bad-inputs"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.prefix}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.prefix}-waf"
    sampled_requests_enabled   = true
  }
}
