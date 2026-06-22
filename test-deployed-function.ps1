# Test the deployed Supabase function directly
$ErrorActionPreference = "Stop"

$functionUrl = "https://cycutcqlhpeudmaebwmb.supabase.co/functions/v1/generate-question"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y3V0Y3FsaHBldWRtYWVid21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzAzNTcsImV4cCI6MjA5NzIwNjM1N30.2s-MMZa-gjJdOBGxOzXKftT-ZA0k6hfj3IoEm0gqaKI"

$body = @{
    subject = "Constitution"
    topic = "Constitutional Framework"
    difficulty = "medium"
    examType = "LDC"
} | ConvertTo-Json

Write-Host "Testing deployed Supabase function..." -ForegroundColor Cyan
Write-Host "Request Body: $body" -ForegroundColor Gray
Write-Host "URL: $functionUrl" -ForegroundColor Gray
Write-Host ""

$start = Get-Date
try {
    $response = Invoke-WebRequest -Uri $functionUrl `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $anonKey"
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -UseBasicParsing
    
    $responseTime = ((Get-Date) - $start).TotalMilliseconds
    $content = $response.Content | ConvertFrom-Json
    
    Write-Host "Status: SUCCESS" -ForegroundColor Green
    Write-Host "Response Time: $([int]$responseTime)ms" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Question Generated:" -ForegroundColor Cyan
    Write-Host "Subject: $($content.subject)" -ForegroundColor White
    Write-Host "Topic: $($content.topic)" -ForegroundColor White
    Write-Host "Question: $($content.question)" -ForegroundColor White
    Write-Host "Options: $($content.options -join ', ')" -ForegroundColor White
    Write-Host "Correct Answer: $($content.correctAnswer)" -ForegroundColor White
    Write-Host "Explanation: $($content.explanation)" -ForegroundColor White
}
catch {
    $responseTime = ((Get-Date) - $start).TotalMilliseconds
    Write-Host "Status: FAILED" -ForegroundColor Red
    Write-Host "Response Time: $([int]$responseTime)ms" -ForegroundColor Gray
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response Body: $errorBody" -ForegroundColor Red
    }
}
