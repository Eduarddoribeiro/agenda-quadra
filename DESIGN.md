---
name: Agenda do Krahe
description: Agenda da quadra de futsal do Ginásio do Krahe, vestida com o escudo do ginásio; a demonstração De Primeira usa a marca neutra.
colors:
  chao-escudo: "#000000"
  letra-branca: "#f5f5f4"
  cartao-grafite: "#121212"
  gaveta-grafite: "#141414"
  grafite-secundario: "#1f1f1f"
  grafite-apagado: "#1c1c1c"
  cinza-legenda: "#a3a3a3"
  linha-grafite: "#2a2a2a"
  borda-campo: "#3d3d3d"
  verde-livre: "#29b14f"
  verde-livre-fundo: "#0c2414"
  verde-livre-tinta: "#a6efbc"
  sobre-verde: "#03130a"
  amarelo-cartao: "#f5c400"
  amarelo-cartao-fundo: "#2b2300"
  amarelo-cartao-tinta: "#ffe27a"
  vermelho-agora: "#ff4d52"
  vermelho-apagar: "#e5383b"
  verde-whatsapp: "#25d366"
  escudo-verde: "#1f9b3b"
  escudo-amarelo: "#f5c400"
  escudo-vermelho: "#e3262b"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 0.85
    letterSpacing: "-0.01em"
    fontVariation: "\"wdth\" 62"
    fontFeature: "\"tnum\""
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.01em"
    fontVariation: "\"wdth\" 62"
    fontFeature: "\"tnum\""
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
rounded:
  celula: "3px"
  lg: "0.75rem"
  xl: "1.05rem"
  2xl: "1.35rem"
  pilula: "9999px"
spacing:
  celula: "3px"
  xs: "8px"
  linha: "10px"
  md: "16px"
  gaveta: "20px"
components:
  botao-reservar:
    backgroundColor: "{colors.verde-livre}"
    textColor: "{colors.sobre-verde}"
    rounded: "{rounded.pilula}"
    padding: "0 20px"
    height: "48px"
  botao-confirmar:
    backgroundColor: "{colors.verde-livre}"
    textColor: "{colors.sobre-verde}"
    rounded: "{rounded.pilula}"
    height: "56px"
    width: "100%"
  botao-principal:
    backgroundColor: "{colors.letra-branca}"
    textColor: "{colors.chao-escudo}"
    rounded: "{rounded.pilula}"
    padding: "0 16px"
    height: "44px"
  botao-redondo:
    backgroundColor: "{colors.cartao-grafite}"
    textColor: "{colors.letra-branca}"
    rounded: "{rounded.pilula}"
    size: "44px"
  linha-livre:
    backgroundColor: "{colors.verde-livre-fundo}"
    textColor: "{colors.verde-livre-tinta}"
    rounded: "{rounded.xl}"
    height: "64px"
  linha-reservada:
    backgroundColor: "{colors.cartao-grafite}"
    textColor: "{colors.letra-branca}"
    rounded: "{rounded.xl}"
    height: "64px"
  linha-bloqueada:
    backgroundColor: "{colors.amarelo-cartao-fundo}"
    textColor: "{colors.amarelo-cartao-tinta}"
    rounded: "{rounded.xl}"
    height: "64px"
  dia-semana-selecionado:
    backgroundColor: "{colors.letra-branca}"
    textColor: "{colors.chao-escudo}"
    rounded: "{rounded.lg}"
    height: "52px"
  campo:
    backgroundColor: "{colors.cartao-grafite}"
    textColor: "{colors.letra-branca}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "4px 12px"
  barra-navegacao:
    backgroundColor: "{colors.cartao-grafite}"
    textColor: "{colors.cinza-legenda}"
    height: "64px"
  barra-navegacao-ativo:
    textColor: "{colors.letra-branca}"
---

# Design System: Agenda do Krahe

## Overview

**Creative North Star: "O Escudo no Placar"**

A agenda veste o escudo do Ginásio do Krahe (`marca/logo-ginasio-krahe.png`): chão preto total, letras brancas, e as três cores do escudo (verde, amarelo, vermelho) trabalhando com função fixa, nunca como enfeite. Os horários aparecem como numerais de placar de ginásio, estreitos e pesados, e o título de cada tela fica em caixa alta como o "KRAHE" do escudo. O dono reconhece o ginásio dele ao abrir o app.

A marca Krahe é **sempre escura**, de dia e de noite: o atributo `data-marca="krahe"` no `<html>` faz a variante `dark:` valer o tempo todo, `color-scheme: dark` acompanha os controles nativos e o `theme-color` é `#000000`. A demonstração De Primeira usa `data-marca="neutra"`: concreto claro e azul-noite, que segue o tema do celular. Nada do Krahe (nome, logo, faixa tricolor, caixa alta dos títulos) aparece na demo; a faixa e a caixa alta são escopadas a `[data-marca="krahe"]` no CSS.

É um app de operação, de uma mão, em ~375px. O mundo empresta paleta, tipo e um gesto assinatura (a faixa tricolor fechando o cabeçalho); navegação inferior, gavetas e controles seguem padrões conhecidos. Densidade média: uma linha de horário por toque, com alvos de 44 a 64px.

**Key Characteristics:**
- Chão preto puro, cartões grafite, profundidade por camadas de tom e não por sombra.
- Verde = livre/reservar/confirmar; amarelo = cartão de bloqueio, foco e item ativo; vermelho = agora e apagar.
- Uma família só (Archivo variável): o eixo `wdth` faz os numerais de placar (62) e o texto corrido.
- Faixa tricolor do escudo de 3px fechando o cabeçalho de toda tela do Krahe.
- Pílulas para ações, cantos arredondados de ~17px para as linhas da agenda.

## Colors

Preto do escudo com três cores de sinal, cada uma com um só trabalho. Os tokens vivem em `src/app/globals.css` (`:root` para o Krahe; `[data-marca="neutra"]` e seu bloco `prefers-color-scheme: dark` para a demo) e são expostos ao Tailwind como `bg-livre`, `text-agora`, `bg-amarelo-fundo` etc.

### Primary
- **Verde Livre** (`--livre`): o horário livre e a ação de reservar. Preenche o botão Reservar, o botão Confirmar reserva, o contador "N horários livres" e as células livres da Semana (a 80%).
- **Verde Livre Fundo / Tinta** (`--livre-fundo`, `--livre-tinta`): o corpo da linha livre na tela Hoje, o cliente selecionado na gaveta, a etiqueta de cliente, os horários para trocar.
- **Sobre Verde** (`--sobre-verde`): texto e ícone em cima de preenchimento verde (Reservar, Confirmar, WhatsApp). Quase preto, nunca branco, no Krahe.

### Secondary
- **Amarelo Cartão** (`--amarelo`): o bloqueio, desenhado como um cartão amarelo de árbitro inclinado; células bloqueadas da Semana; borda do aviso "Juntar repetidos".
- **Amarelo Cartão Fundo / Tinta** (`--amarelo-fundo`, `--amarelo-tinta`): corpo da linha bloqueada e do aviso de repetidos.
- **Destaque** (`--destaque`, amarelo no Krahe): a linha de quadra no topo do item ativo da navegação, o cursor dos campos e a seleção de texto (35%). O anel de foco (`--ring`) também é amarelo.

### Tertiary
- **Vermelho Agora** (`--agora`): a linha "agora" que corta a agenda, o numeral da hora corrente, o ponto de "hoje" na faixa da semana e o rótulo "hoje" na Semana.
- **Vermelho Apagar** (`--destructive`): apagar cliente (fundo do deslizar), cancelar reserva, mensagens de erro.
- **Verde WhatsApp** (`--whatsapp`): só o botão de conversar no WhatsApp dentro da gaveta da reserva.

### Neutral
- **Chão do Escudo** (`--background`): fundo de todas as telas e do cabeçalho fixo.
- **Letra Branca** (`--foreground`, `--primary`): texto, numerais, botão principal em pílula branca, dia selecionado na faixa da semana, células reservadas da Semana.
- **Cartão Grafite** (`--card`) e **Gaveta Grafite** (`--popover`): linhas reservadas, listas, botões redondos, barra de navegação (a 85-95% com blur) e gavetas.
- **Grafite Secundário / Apagado** (`--secondary`, `--muted`, `--accent`): estados pressionados, caixas informativas, trilho do interruptor.
- **Cinza Legenda** (`--muted-foreground`): datas sob o título, telefones, legendas, horas que já passaram.
- **Linha Grafite** (`--border`) e **Borda de Campo** (`--input`): divisórias, contornos de cartão e de campo.
- **Faixas do Escudo** (`--escudo-verde`, `--escudo-amarelo`, `--escudo-vermelho`): as cores exatas do logo, usadas apenas na faixa tricolor do cabeçalho.

### Marca neutra (demonstração De Primeira)
Mesmos nomes de token, outros valores: claro com fundo concreto `#e8ecf0`, texto e botão principal azul-noite `#0f1b2d`, livre `#0b7a41`, agora laranja `#e0531f`; no escuro do celular, fundo `#0d1626`, cartão `#15213a`, livre `#3dd68c`. Ali `--destaque` é a própria cor do texto, não amarelo. Os valores completos estão no sidecar (`.impeccable/design.json`, `extensions.marcas.neutra`).

### Named Rules
**The Three Jobs Rule.** Verde é livre e reservar, amarelo é bloqueio e foco, vermelho é agora e apagar. Uma cor do escudo nunca assume o trabalho de outra, e nenhuma aparece só para decorar.

**The Always Dark Rule.** No Krahe não existe tema claro. Telas novas usam os tokens e a variante `dark:`, que já está sempre ligada; nunca um `bg-white` ou um tema que siga o celular.

**The No Hardcode Rule.** Cor sai de token (`bg-livre`, `text-sobre-verde`, `bg-card`), porque o mesmo componente precisa vestir as duas marcas.

## Typography

**Display Font:** Archivo variável, eixo de largura em 62 (com ui-sans-serif, system-ui)
**Body Font:** Archivo, largura normal
**Label/Mono Font:** Archivo; `font-estreita` (wdth 80) para o número do dia no ícone Hoje

**Character:** Uma família só faz as duas vozes: o placar estreito e pesado dos horários e títulos, e o texto corrido simples e legível do balcão.

### Hierarchy
- **Display** (800, 3.25rem, 0.85, wdth 62, caixa alta no Krahe): o título da tela ("HOJE", "SEMANA", "CLIENTES"). O nome de outro dia cai para 2.75rem para caber ao lado das setas. Na tela Entrar, 2.5rem.
- **Headline** (800, 2.75rem, 0.9, wdth 62, numerais tabulares): o numeral do horário em cada linha da agenda, com o sufixo "h" ou "h30" a 0.36em, em negrito, alinhado no topo. Variações do mesmo placar: 2.25rem para o dia na Semana, 2rem no título da gaveta Reservar, 3rem no horário da gaveta da reserva, 1.5rem para o total de livres.
- **Title** (700, 1rem): nome do cliente na linha reservada, "Livre", títulos de bloco nas gavetas; o nome do cliente no topo da gaveta sobe para 1.5rem extrabold.
- **Body** (400, 0.875rem): resumo do dia, descrições, mensagens. Campos usam 1rem para o celular não dar zoom.
- **Label** (400-700, 0.75rem): telefone, "até 16h", rótulos da navegação, legenda da Semana, dias da faixa da semana.

### Named Rules
**The Scoreboard Rule.** `font-placar` é para números e títulos de tela: horários, dias do mês, contagens e o título em caixa alta. Frase corrida nunca usa o eixo estreito.

**The Crest Caps Rule.** A caixa alta vem da classe `.titulo-tela`, escopada ao Krahe. Não escreva caixa alta no texto nem use `uppercase` solto, senão vaza para a demo.

## Layout

Coluna única para o polegar, centrada em `max-w-md` (28rem), com margem lateral de 16px. Cabeçalho fixo no topo (`sticky`, fundo preto) com título à esquerda e controles redondos de 44px à direita, e logo abaixo a faixa da semana em 7 colunas (botões de 52px de altura, 4px de vão). A barra de navegação inferior é fixa, 4 colunas de 64px, respeitando a área segura (`pb-seguro`).

A agenda do dia é uma grade de duas colunas: 4.25rem para o numeral e o resto para a linha, com 8px de vão e 10px entre linhas. Linhas têm no mínimo 64px. Horas passadas que ficaram livres se juntam numa linha curta tracejada de 44px, para o dono não rolar por horas mortas. A Semana usa linhas de 72px em grade de três colunas (3.5rem dia, barra de ocupação, 4.25rem contagem), com células de ocupação de 36px de altura e 3px de vão, uma coluna a cada 30 minutos.

Gavetas sobem de baixo, até `100dvh - 6rem`, com 20px de margem interna e o botão de confirmar fixo no rodapé, separado por uma linha. Deslizar para os lados troca de dia (o conteúdo acompanha o dedo a 35%).

## Elevation & Depth

Plano. A profundidade vem de camadas de tom sobre o preto: chão `--background`, cartões `--card` um degrau acima, gavetas `--popover`, sempre com a linha `--border` de 1px quando o cartão precisa de contorno. A barra de navegação é translúcida (85-95%) com desfoque de fundo. Sombras pequenas aparecem só em objetos miniatura (o cartão amarelo do bloqueio, a bolinha do interruptor) e na barra flutuante de salvar dos horários de funcionamento.

### Shadow Vocabulary
- **Miniatura** (`shadow-sm` do Tailwind): o cartão amarelo inclinado na linha bloqueada.
- **Botão flutuante** (`shadow-lg` do Tailwind): a barra fixa "Salvar" no editor de horários.

### Named Rules
**The Tonal Step Rule.** Para separar uma superfície, suba um degrau de grafite ou ponha a linha de 1px; não use sombra para isso.

## Shapes

Duas famílias de forma. Ações são pílulas (`rounded-full`): Reservar, Confirmar, botão principal, setas redondas de 44px, Compartilhar livres. Superfícies da agenda são retângulos de canto macio: linhas de horário e cartões em `rounded-xl` (1.05rem), campos e dias da faixa em `rounded-lg` (0.75rem), estados vazios em `rounded-2xl` (1.35rem) com contorno tracejado de 2px. As células da Semana e as amostras da legenda têm canto de 3px, como pastilhas de placar. O tracejado significa "nada aqui": hora que passou livre, quadra fechada, cadastrar cliente novo.

## Components

### Buttons
- **Shape:** pílula (`rounded-full`).
- **Reservar:** dentro da linha livre, `--livre` com texto `--sobre-verde`, 48px de altura, 20px laterais, ícone de mais em traço 2.75 e rótulo 15px negrito.
- **Confirmar:** largura total, 56px, `--livre`, 16px negrito, no rodapé da gaveta; desabilitado a 40%.
- **Principal:** pílula branca (`--primary`) com texto preto, 44px, 14px negrito: "Hoje" quando se está em outro dia, "Novo cliente", "Ajustar horários".
- **Redondo:** 44px, `--card` com contorno, setas de dia anterior/próximo.
- **Contorno:** pílula com `--border` sobre o fundo, 40px, 14px seminegrito (Compartilhar livres, ajustar horário na gaveta).
- **Focus:** anel de 3px em `--ring` (amarelo) a 60%. **Pressionado:** `active:bg-muted` ou leve encolhimento (`scale(0.985)`) na linha livre.

### Linhas da agenda (componente assinatura)
- **Livre:** linha inteira tocável em `--livre-fundo`, "Livre" e "até 16h" em `--livre-tinta`, botão Reservar à direita.
- **Reservada:** `--card` com contorno, nome do cliente em negrito, telefone ou observação em cinza, ícone de repetir quando é horário fixo; à direita, uma coluna de 56px separada por linha com o WhatsApp. Jogo fora da grade mostra "14h30 às 16h" em negrito antes do telefone.
- **Bloqueada:** `--amarelo-fundo` com o cartão amarelo de árbitro (16x24px, girado -12°) e o motivo.
- **Passada:** a 60% de opacidade; numeral em cinza.
- **Agora:** uma linha vermelha de 2px atravessa a agenda com o rótulo "agora", e o numeral fica `--agora`.

### Numeral de horário
"18" grande em `font-placar` com "h" ou "h30" pequeno (0.36em, negrito) alinhado no topo. É o mesmo componente na agenda, na gaveta da reserva e na troca de horário.

### Cards / Containers
- **Corner Style:** 1.05rem (`rounded-xl`).
- **Background:** `--card`; listas de clientes agrupadas num único cartão com divisórias.
- **Shadow Strategy:** nenhuma (ver Elevation & Depth).
- **Border:** 1px `--border`; hoje na Semana ganha contorno de 2px em `--foreground`.
- **Internal Padding:** 16px laterais, 10px verticais.

### Inputs / Fields
- **Style:** 44px, `--card` com `--input` a 30% por cima no escuro, contorno `--input`, canto 0.75rem, texto 16px; busca com lupa à esquerda.
- **Focus:** contorno vira `--ring` e ganha anel de 3px a 50%.
- **Error / Disabled:** contorno `--destructive`; desabilitado a 50%. Conflito de horário aparece como faixa `--destructive` a 10% com texto seminegrito.
- **Interruptor:** trilho de 28x48px em `--muted`, bolinha branca de 20px.

### Navigation
Barra inferior de 4 itens (Hoje, Semana, Clientes, Ajustes), ícones de 24px e rótulo de 12px. Inativo em `--muted-foreground` com traço 1.8; ativo em `--foreground`, negrito, traço 2.4 e uma linha de quadra de 3x40px em `--destaque` no topo. O ícone de Hoje é um calendarinho com o número do dia. Foco pinta o fundo de `--muted`.

### Faixa da semana
Sete dias sob o título; o selecionado vira bloco branco com texto preto, hoje (quando não selecionado) leva um ponto vermelho de 4px, dias passados ficam em cinza.

### Faixa tricolor do cabeçalho
O `.cabecalho` do Krahe troca a borda inferior por 3px divididos em terços: `--escudo-verde`, `--escudo-amarelo`, `--escudo-vermelho`, com 2px de preto entre eles. Na marca neutra é uma borda simples de 1px.

### Gavetas
Sobem de baixo em `--popover`, canto superior de 1.05rem, com alça de arrastar. Cabeçalho com numeral de placar ou nome do cliente, corpo rolável, rodapé com a ação principal.

## Do's and Don'ts

### Do:
- **Do** use `.cabecalho` e `.titulo-tela font-placar` em toda tela nova do app; a faixa tricolor e a caixa alta aparecem sozinhas no Krahe e somem na demo.
- **Do** dê a cada cor do escudo o seu trabalho: verde para livre e reservar, amarelo para bloqueio e foco, vermelho para agora e apagar.
- **Do** use `text-sobre-verde` em todo texto e ícone sobre preenchimento verde.
- **Do** mantenha a ação mais comum a um toque e no alcance do polegar, com alvos de pelo menos 44px (linhas de 64px).
- **Do** junte horas passadas livres numa linha tracejada curta em vez de listá-las uma a uma.
- **Do** teste em 375px e nas duas marcas (`data-marca="krahe"` e `"neutra"`, esta no claro e no escuro).

### Don't:
- **Don't** crie tema claro para o Krahe nem deixe uma tela do Krahe seguir o tema do celular.
- **Don't** traga o azul-noite da marca neutra para o Krahe, nem nome, logo, faixa ou cores do Krahe para a demo De Primeira.
- **Don't** use as cores das faixas do escudo (`--escudo-*`) fora da faixa do cabeçalho.
- **Don't** escreva cor fixa (`bg-black`, `text-white`, `#06210f`) em componente; use o token.
- **Don't** separe superfícies com sombra; use o degrau de grafite ou a linha de 1px.
- **Don't** use `font-placar` em frases ou rótulos corridos.
