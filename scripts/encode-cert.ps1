# PowerShell script to convert .p12 certificate to base64 for GitHub Secrets
# Usage: .\scripts\encode-cert.ps1 -CertPath "path\to\your\certificate.p12"

param(
    [Parameter(Mandatory=$true)]
    [string]$CertPath
)

if (-not (Test-Path $CertPath)) {
    Write-Error "Certificate file not found: $CertPath"
    exit 1
}

Write-Host "Reading certificate file: $CertPath" -ForegroundColor Green

# Read certificate and convert to base64
$certBytes = [System.IO.File]::ReadAllBytes($CertPath)
$base64 = [System.Convert]::ToBase64String($certBytes)

# Save to file
$outputPath = "certificate-base64.txt"
$base64 | Out-File -FilePath $outputPath -Encoding ASCII -NoNewline

Write-Host ""
Write-Host "✅ Certificate converted to base64!" -ForegroundColor Green
Write-Host "📄 Output saved to: $outputPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open the file: $outputPath"
Write-Host "2. Copy the entire content (it will be very long)"
Write-Host "3. Go to: https://github.com/Hukushiyu/claude_terminal/settings/secrets/actions"
Write-Host "4. Click 'New repository secret'"
Write-Host "5. Name: APPLE_CERTIFICATE"
Write-Host "6. Value: Paste the copied base64 string"
Write-Host "7. Click 'Add secret'"
Write-Host ""
Write-Host "Also add these secrets:"
Write-Host "- APPLE_CERTIFICATE_PASSWORD (your .p12 password)"
Write-Host "- APPLE_SIGNING_IDENTITY (e.g., 'Developer ID Application: Your Name (TEAM_ID)')"
Write-Host ""
