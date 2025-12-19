$targetDir = "public/sounds"
if (!(Test-Path -Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

# Google Actions Sound Library URLs (Public Domain/Free)
$assets = @{
    "click.mp3" = "https://actions.google.com/sounds/v1/cartoon/pop.ogg"; 
    "type.mp3"  = "https://actions.google.com/sounds/v1/foley/keyboard_typing_fast.ogg"; 
    "win.mp3"   = "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg";
    "lose.mp3"  = "https://actions.google.com/sounds/v1/cartoon/fail_trombone.ogg";
    "error.mp3" = "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg";
    "bgm.mp3"   = "https://actions.google.com/sounds/v1/science_fiction/scifi_industrial_loop.ogg"; 
}

# Note: Saving as .mp3 for code consistency, though they are OGG. 
# Modern browsers play OGG fine even with .mp3 extension usually, 
# but for correctness we should arguably use .ogg. 
# I will stick to the filenames expected by the hook for now.

Write-Host "Downloading Audio Assets from Google..." -ForegroundColor Cyan

foreach ($key in $assets.Keys) {
    $url = $assets[$key]
    $output = Join-Path $targetDir $key
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $output
        Write-Host "Downloaded $key" -ForegroundColor Green
    } catch {
        Write-Host "Failed to download $key from $url" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host "Done!" -ForegroundColor Cyan
