# Laboratório: formulário CRUD configurável por schema

Este diretório contém um formulário inteiramente dirigido por um contrato JSON ou YAML. O
componente de formulário não conhece nenhum campo de negócio: ele lê o schema e constrói
`FormGroup`, `FormArray`, validadores, widgets, condicionais e a árvore de inspeção em tempo de
execução.

O laboratório é independente do restante da aplicação. Ele é carregado por uma única rota lazy em
`/lab` e não usa autenticação nem serviços de posts.

## Como executar

```bash
npm start
```

Abra `http://localhost:4200/lab`.

A tela tem quatro abas:

| Aba             | O que mostra                                                                |
| --------------- | --------------------------------------------------------------------------- |
| Formulário      | O formulário renderizado a partir do schema aplicado, com seções e sub-abas |
| Fonte do schema | Editor YAML/JSON, diagnóstico do parser e árvore normalizada                |
| Tipagem         | Árvore de campos e detalhes completos do campo selecionado                  |
| Payload         | Valor atual de `form.value` e último payload enviado                        |

## Contrato do schema

O contrato é um modelo interno, deliberadamente menor que JSON Schema. Ele descreve apenas o que
o laboratório precisa: identidade, tipagem, widget, opções, regras e visibilidade.

```yaml
id: cadastro-profissional
title: Cadastro profissional
description: Texto exibido no topo do formulário
submitLabel: Enviar cadastro

sections:
  - id: identificacao
    title: Identificação
    description: Texto opcional da seção
    fields:
      - name: nome
        label: Nome completo
        type: string
        required: true
        placeholder: Ana Souza
        rules:
          minLength: 3
          maxLength: 80
```

### Estrutura

| Chave         | Obrigatória | Descrição                                          |
| ------------- | ----------- | -------------------------------------------------- |
| `id`          | não         | Identificador do formulário; padrão `dynamic-form` |
| `title`       | não         | Título exibido; padrão `Formulário`                |
| `description` | não         | Texto de apoio abaixo do título                    |
| `submitLabel` | não         | Rótulo do botão de envio; padrão `Enviar`          |
| `sections`    | sim         | Lista de seções; cada seção vira uma sub-aba       |

Cada seção exige `id`, `title` e um array `fields` com pelo menos um campo válido.

### Campo

| Chave                   | Aplicação | Descrição                                                   |
| ----------------------- | --------- | ----------------------------------------------------------- |
| `name`                  | todos     | Nome da chave no payload; aceita letras, números, `_` e `-` |
| `label`                 | todos     | Rótulo exibido; se omitido, é humanizado a partir de `name` |
| `type`                  | todos     | Define o tipo do valor e o widget padrão                    |
| `widget`                | todos     | Sobrescreve o widget padrão, respeitando a compatibilidade  |
| `description`           | todos     | Texto de ajuda abaixo do rótulo                             |
| `placeholder`           | todos     | Placeholder de inputs                                       |
| `required`              | todos     | Gera `Validators.required`; em boolean, exige `true`        |
| `defaultValue`          | todos     | Valor inicial usado na construção do controle               |
| `rules`                 | todos     | `min`, `max`, `minLength`, `maxLength`, `pattern` e `step`  |
| `visibleWhen`           | todos     | Condição de exibição baseada em outro campo                 |
| `options`               | `enum`    | Lista de `{ label, value, description? }`                   |
| `multiple`              | `enum`    | Quando `true`, o payload é um array                         |
| `fields`                | `object`  | Campos aninhados, renderizados como novo `FormGroup`        |
| `items`                 | `array`   | Schema de cada item repetido em um `FormArray`              |
| `minItems` / `maxItems` | `array`   | Quantidade mínima e máxima de itens                         |

### Tipos disponíveis

| Tipo      | Valor no payload                   | Widget padrão   |
| --------- | ---------------------------------- | --------------- |
| `string`  | `string`                           | `text`          |
| `number`  | `number \| null`                   | `number`        |
| `boolean` | `boolean`                          | `switch`        |
| `enum`    | valor da opção ou array de valores | `select`        |
| `date`    | `string` (`yyyy-mm-dd`)            | `date`          |
| `time`    | `string` (`HH:mm`)                 | `time`          |
| `color`   | `string` (`#rrggbb`)               | `color`         |
| `json`    | objeto, array ou primitivo         | `json`          |
| `object`  | objeto aninhado                    | grupo de campos |
| `array`   | array de itens                     | `repeater`      |

### Widgets disponíveis

| Widget           | Tipos aceitos | Uso                                   |
| ---------------- | ------------- | ------------------------------------- |
| `text`           | `string`      | Texto curto                           |
| `textarea`       | `string`      | Texto longo                           |
| `email`          | `string`      | Entrada de e-mail                     |
| `url`            | `string`      | Entrada de URL                        |
| `password`       | `string`      | Campo mascarado                       |
| `number`         | `number`      | Número com `min`, `max` e `step`      |
| `range`          | `number`      | Slider numérico                       |
| `select`         | `enum`        | Lista suspensa, simples ou múltipla   |
| `radio`          | `enum`        | Escolha única visível                 |
| `checkbox-group` | `enum`        | Escolha múltipla com array no payload |
| `switch`         | `boolean`     | Booleano ligado/desligado             |
| `date`           | `date`        | Data nativa                           |
| `time`           | `time`        | Hora nativa                           |
| `color`          | `color`       | Seletor de cor                        |
| `json`           | `json`        | Editor de JSON válido                 |
| `repeater`       | `array`       | Lista com adicionar e remover itens   |

O normalizador rejeita widgets incompatíveis com o tipo e registra um aviso no diagnóstico. Um
`enum` com `multiple: true` usa `checkbox-group` por padrão; `radio` com múltipla escolha também é
convertido para `checkbox-group`.

## Schema e valor são planos diferentes

O schema descreve os campos. O valor é o payload produzido pelo formulário. Rótulos, descrições,
widgets, opções e regras nunca entram no payload.

```yaml
- name: plano
  label: Plano
  type: enum
  options:
    - label: Plano Pro
      value: pro
```

O payload correspondente é apenas:

```json
{ "plano": "pro" }
```

O laboratório lê o payload de `form.value`, e não de `getRawValue()`. Isso é intencional: campos
invisíveis ficam desabilitados e saem do payload, enquanto continuam existindo no formulário para
serem reativados quando a condição mudar.

## Condições de visibilidade

`visibleWhen` referencia outro campo por `name` ou caminho pontuado.

```yaml
- name: tipoPessoa
  label: Tipo de pessoa
  type: enum
  widget: radio
  defaultValue: pf
  options:
    - label: Pessoa física
      value: pf
    - label: Pessoa jurídica
      value: pj

- name: cpf
  label: CPF
  type: string
  visibleWhen:
    field: tipoPessoa
    equals: pf

- name: cnpj
  label: CNPJ
  type: string
  visibleWhen:
    field: tipoPessoa
    equals: pj
```

Variações aceitas:

```yaml
visibleWhen:
  field: tipoPessoa
  in: [pf, estrangeiro]
```

```yaml
visibleWhen:
  field: newsletter
```

Sem `equals` e sem `in`, a condição usa a veracidade do valor atual. Caminhos aninhados funcionam:
`field: empresa.contato.email`.

## Objetos e listas

Objetos viram `FormGroup` aninhados e podem conter novos objetos.

```yaml
- name: empresa
  label: Empresa
  type: object
  fields:
    - name: nome
      label: Nome da empresa
      type: string
      required: true
    - name: contato
      label: Contato corporativo
      type: object
      fields:
        - name: email
          label: E-mail
          type: string
          widget: email
```

Listas usam `items` para descrever cada linha. O componente repete o schema de `items`, cria um
`FormGroup` por item quando o item é um objeto, e permite adicionar ou remover linhas conforme
`minItems` e `maxItems`.

```yaml
- name: projetos
  label: Projetos
  type: array
  maxItems: 4
  items:
    type: object
    fields:
      - name: nome
        label: Nome
        type: string
        required: true
      - name: ativo
        label: Em produção
        type: boolean
        defaultValue: true
```

## Formato e diagnóstico

O editor aceita JSON e YAML. O botão de formato converte o texto atual entre os dois em vez de
reinterpretar os mesmos caracteres, e cada aplicação reconstrói o formulário do zero.

O parser normaliza o schema e acumula problemas com caminho, severidade e mensagem. Erros impedem
a renderização; avisos permitem continuar com um fallback seguro.

Exemplos de diagnóstico:

| Situação                       | Resultado                                   |
| ------------------------------ | ------------------------------------------- |
| Tipo desconhecido              | Erro em `$.sections[n].fields[m].type`      |
| `enum` sem `options`           | Erro; o campo é descartado                  |
| Widget incompatível com o tipo | Aviso; usa o widget padrão                  |
| `min > max`                    | Aviso; ambas as regras continuam declaradas |
| `pattern` inválido             | Aviso; a regra é ignorada                   |
| `defaultValue` incompatível    | Aviso; o valor padrão é ignorado            |
| Nome duplicado na mesma seção  | Erro; a duplicata é descartada              |

## Inspeção de tipagem

Cada campo renderizado exibe `type`, `widget`, forma do valor e o caminho completo. O botão
`config` abre a aba **Tipagem** com:

- documentação do widget ativo;
- regras efetivamente aplicadas;
- valor atual daquele caminho;
- tabela de opções quando o campo é `enum`;
- condição de visibilidade;
- definição normalizada completa em JSON.

A aba também funciona sem interação no formulário: a árvore lista todos os campos, inclusive os de
objetos aninhados e os templates de itens de lista, marcados com `[]`.

## Arquitetura

```
src/app/lab
  crud/                            shell do laboratório, editor e painéis
    demo-schemas.ts                exemplos YAML, JSON mínimo e schema inválido
    crud-lab.component.*           estado das abas, aplicação do schema e payload
    source-panel.component.*       editor, diagnóstico e estrutura normalizada
    payload-panel.component.*      payload atual e último envio
    schema-issues.component.*      lista de erros e avisos
  dynamic-form/
    domain/                        modelos do schema e normalizador JSON/YAML
    engine/                        FormGroup, visibilidade, índice de campos e metadados
    presentation/                  formulário, frames, controles, inspetor
```

Fluxo de execução:

1. O texto é lido como JSON ou YAML.
2. O normalizador valida e produz um `FormSchema` tipado, ou uma lista de problemas.
3. O engine percorre as seções e constrói `FormGroup`, `FormArray` e validadores.
4. A apresentação renderiza seções, objetos recursivamente, listas e condicionais.
5. O índice de campos alimenta a árvore de tipagem.
6. `form.value` alimenta a aba de payload e o evento de envio.

## Como estender

### Adicionar um widget

1. Inclua o nome em `FIELD_WIDGETS` e na matriz `WIDGET_ACCEPTS` em
   `dynamic-form/domain/field-schema.model.ts`.
2. Registre a documentação em `WIDGET_CATALOG` em `dynamic-form/engine/field-metadata.ts`.
3. Renderize o widget no controle de apresentação adequado:
   - escalares em `scalar-control`;
   - escolhas em `choice-control`;
   - estruturas livres em `json-control`;
   - listas em `schema-fields`.
4. Adicione um exemplo em `demo-schemas.ts` e um teste no normalizador.

### Adicionar uma regra

1. Inclua a chave em `FieldRules`.
2. Leia e valide a chave em `normalizeRules`.
3. Converta a regra em `ValidatorFn` em `buildValidators`.
4. Descreva a regra em `describeRules` para que ela apareça no inspetor.

### Adicionar um tipo

1. Inclua o tipo em `FIELD_TYPES`, `DEFAULT_WIDGET` e `WIDGET_ACCEPTS`.
2. Crie a interface específica e inclua a união em `FieldSchema`.
3. Trate o valor inicial em `initialValue`.
4. Trate a forma do valor em `valueShapeOf`.
5. Renderize o tipo em `schema-fields.component.html`.

## Limitações conhecidas

- O contrato é próprio; não é um subconjunto completo de JSON Schema.
- Condições combinam apenas um campo com `equals`, `in` ou veracidade simples.
- Regras declarativas cobrem comprimento, faixa numérica, padrão e quantidade de itens. Regras
  cruzadas exigem validador customizado.
- O payload é lido de `form.value`; campos ocultos ficam fora do envio por decisão de projeto.
- O editor de schema não tem realce de sintaxe.
- Não há persistência: recarregar a página restaura o exemplo inicial.

## Removendo o laboratório

O laboratório está isolado em `src/app/lab`. Para removê-lo:

1. Apague `src/app/lab`.
2. Remova a rota `lab` de `src/app/app.routes.ts`.
3. Se nenhum outro código usar `yaml`, remova a dependência e a entrada
   `allowedCommonJsDependencies` de `angular.json`.
