# Fechamento de turno

Aplicação front-end em React para registrar os dados de um turno, calcular o ticket médio e a revisão do caixa e gerar uma prévia formatada para compartilhar no WhatsApp.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm

## Desenvolvimento

```sh
npm.cmd install
npm.cmd run dev
```

O Vite informa no terminal o endereço local da aplicação.

## Verificações

```sh
npm.cmd run lint
npm.cmd run build
```

## Funcionalidades

- Data no formato `DD/MM/AAAA`, com o dia da semana na prévia.
- Seleção dos turnos diurno e noturno.
- Cadastro dinâmico da equipe, diárias, vales, forma de pagamento e situação de recebimento.
- Cálculo do ticket médio, total da revisão e diferença em relação ao faturamento.
- Prévia formatada e cópia para a área de transferência.
- Temas padrão, laranja, vermelho e modo escuro.

Os dados permanecem apenas no estado da página e ainda não são salvos em banco de dados.
