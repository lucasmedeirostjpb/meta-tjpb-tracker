# Script de Verificacao da Configuracao do Supabase

Write-Host "Verificando configuracao do Supabase..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "ERRO: Arquivo .env nao encontrado!" -ForegroundColor Red
    Write-Host "Execute: Copy-Item .env.example .env" -ForegroundColor Yellow
    Write-Host ""
    exit 1
} else {
    Write-Host "OK: Arquivo .env encontrado" -ForegroundColor Green
}

# Ler variaveis do .env
$envContent = Get-Content ".env" -Raw
$hasUrl = $envContent -match 'VITE_SUPABASE_URL=.+supabase\.co'
$hasKey = $envContent -match 'VITE_SUPABASE_PUBLISHABLE_KEY=eyJ.+'
$hasProjectId = $envContent -match 'VITE_SUPABASE_PROJECT_ID=.+'
$mockMode = if ($envContent -match 'VITE_MOCK_MODE=true') { $true } else { $false }

# Verificar URL
if ($hasUrl) {
    Write-Host "OK: VITE_SUPABASE_URL configurado" -ForegroundColor Green
} else {
    Write-Host "ERRO: VITE_SUPABASE_URL nao configurado ou invalido" -ForegroundColor Red
    Write-Host "Formato: https://seu-projeto.supabase.co" -ForegroundColor Yellow
}

# Verificar chave
if ($hasKey) {
    Write-Host "OK: VITE_SUPABASE_PUBLISHABLE_KEY configurado" -ForegroundColor Green
} else {
    Write-Host "ERRO: VITE_SUPABASE_PUBLISHABLE_KEY nao configurado ou invalido" -ForegroundColor Red
    Write-Host "Deve comecar com 'eyJ'" -ForegroundColor Yellow
}

# Verificar Project ID
if ($hasProjectId) {
    Write-Host "OK: VITE_SUPABASE_PROJECT_ID configurado" -ForegroundColor Green
} else {
    Write-Host "AVISO: VITE_SUPABASE_PROJECT_ID nao configurado" -ForegroundColor Yellow
    Write-Host "Opcional, mas recomendado" -ForegroundColor Gray
}

# Verificar modo mock
Write-Host ""
if ($mockMode) {
    Write-Host "Modo MOCK ativado (VITE_MOCK_MODE=true)" -ForegroundColor Magenta
    Write-Host "O sistema usara dados ficticios" -ForegroundColor Gray
} else {
    Write-Host "Modo REAL ativado (VITE_MOCK_MODE=false)" -ForegroundColor Cyan
    Write-Host "O sistema usara o Supabase configurado" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Verificando estrutura do Supabase..." -ForegroundColor Cyan

$files = @(
    "src\integrations\supabase\client.ts",
    "src\integrations\supabase\types.ts",
    "src\integrations\supabase\index.ts"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  ERRO: $file nao encontrado!" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""
Write-Host "Verificando migrations do banco..." -ForegroundColor Cyan

$migrations = @(
    "supabase\migrations\20251127_inicial_completa.sql",
    "supabase\migrations\20251128_add_linha_planilha.sql",
    "supabase\migrations\20251128_add_auth_and_history.sql",
    "supabase\migrations\20251128_add_prestacao_contas.sql"
)

$allMigrationsExist = $true
foreach ($migration in $migrations) {
    if (Test-Path $migration) {
        Write-Host "  OK: $(Split-Path $migration -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "  ERRO: $(Split-Path $migration -Leaf) nao encontrado!" -ForegroundColor Red
        $allMigrationsExist = $false
    }
}

Write-Host ""
Write-Host "Verificando dependencias..." -ForegroundColor Cyan

if (Test-Path "node_modules\@supabase\supabase-js") {
    Write-Host "  OK: @supabase/supabase-js instalado" -ForegroundColor Green
} else {
    Write-Host "  ERRO: @supabase/supabase-js nao instalado!" -ForegroundColor Red
    Write-Host "  Execute: npm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Gray
Write-Host ""

# Resumo final
if ($hasUrl -and $hasKey -and $allFilesExist) {
    Write-Host "Configuracao OK! Sistema pronto para uso." -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "1. Execute as migrations no Supabase SQL Editor" -ForegroundColor White
    Write-Host "2. Execute: npm run dev" -ForegroundColor White
    Write-Host "3. Acesse: http://localhost:8080" -ForegroundColor White
} else {
    Write-Host "Configuracao incompleta." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para resolver:" -ForegroundColor Cyan
    Write-Host "1. Configure o arquivo .env com suas credenciais do Supabase" -ForegroundColor White
    Write-Host "2. Instale dependencias: npm install" -ForegroundColor White
    Write-Host "3. Execute este script novamente para verificar" -ForegroundColor White
}

Write-Host ""
