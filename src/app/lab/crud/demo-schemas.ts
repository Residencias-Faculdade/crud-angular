import { SchemaFormat } from '../dynamic-form/domain/form-schema.model';

export interface SchemaSample {
  id: string;
  label: string;
  summary: string;
  format: SchemaFormat;
  source: string;
}

const COMPLETE_YAML = `id: cadastro-profissional
title: Cadastro profissional
description: Cada campo desta tela nasce do schema abaixo. O componente não conhece nenhum campo em específico, só os tipos declarados aqui.
submitLabel: Enviar cadastro

sections:
  - id: identificacao
    title: Identificação
    description: Tipos escalares, widgets nativos e validação declarativa.
    fields:
      - name: nome
        label: Nome completo
        type: string
        placeholder: Ana Souza
        required: true
        rules:
          minLength: 3
          maxLength: 80
      - name: email
        label: E-mail
        type: string
        widget: email
        placeholder: ana@empresa.com
        required: true
      - name: senha
        label: Senha
        type: string
        widget: password
        required: true
        rules:
          minLength: 8
      - name: idade
        label: Idade
        type: number
        required: true
        rules:
          min: 18
          max: 120
      - name: site
        label: Site pessoal
        type: string
        widget: url
        placeholder: https://exemplo.com
      - name: bio
        label: Bio
        type: string
        widget: textarea
        placeholder: Conte em poucas linhas a sua trajetória.
        rules:
          maxLength: 280

  - id: preferencias
    title: Preferências
    description: Enum, múltipla escolha, booleanos e controles nativos com valor tipado.
    fields:
      - name: perfil
        label: Perfil de acesso
        type: enum
        widget: radio
        required: true
        defaultValue: editor
        options:
          - label: Administrador
            value: admin
            description: Acesso total, inclusive configurações.
          - label: Editor
            value: editor
            description: Pode criar e publicar conteúdo.
          - label: Leitor
            value: viewer
            description: Apenas leitura.
      - name: plano
        label: Plano
        type: enum
        defaultValue: pro
        options:
          - label: Free
            value: free
          - label: Pro
            value: pro
          - label: Enterprise
            value: enterprise
      - name: interesses
        label: Interesses
        type: enum
        multiple: true
        defaultValue: [frontend, dados]
        options:
          - label: Frontend
            value: frontend
          - label: Backend
            value: backend
          - label: DevOps
            value: devops
          - label: Dados
            value: dados
          - label: Design
            value: design
      - name: canais
        label: Canais de contato
        type: enum
        widget: select
        multiple: true
        options:
          - label: E-mail
            value: email
          - label: SMS
            value: sms
          - label: Push
            value: push
      - name: newsletter
        label: Receber newsletter
        type: boolean
        defaultValue: true
      - name: experiencia
        label: Anos de experiência
        type: number
        widget: range
        defaultValue: 3
        rules:
          min: 0
          max: 20
          step: 1
      - name: nascimento
        label: Data de nascimento
        type: date
      - name: horario
        label: Horário preferido
        type: time
      - name: cor
        label: Cor do perfil
        type: color
        defaultValue: "#2563eb"

  - id: dados-profissionais
    title: Empresa e endereço
    description: Objetos aninhados viram FormGroups e repetem a tipagem em cada nível.
    fields:
      - name: empresa
        label: Empresa
        type: object
        fields:
          - name: nome
            label: Nome da empresa
            type: string
            required: true
          - name: cargo
            label: Cargo
            type: enum
            options:
              - label: Desenvolvedor
                value: dev
              - label: Designer
                value: design
              - label: Gestor
                value: manager
          - name: contato
            label: Contato corporativo
            type: object
            fields:
              - name: email
                label: E-mail corporativo
                type: string
                widget: email
              - name: telefone
                label: Telefone
                type: string
                placeholder: "+55 11 99999-9999"
      - name: endereco
        label: Endereço
        type: object
        fields:
          - name: cep
            label: CEP
            type: string
            rules:
              pattern: '^\\d{5}-?\\d{3}$'
          - name: cidade
            label: Cidade
            type: string
          - name: uf
            label: UF
            type: enum
            widget: select
            options:
              - label: São Paulo
                value: SP
              - label: Rio de Janeiro
                value: RJ
              - label: Minas Gerais
                value: MG
              - label: Paraná
                value: PR
              - label: Rio Grande do Sul
                value: RS
          - name: pais
            label: País
            type: enum
            defaultValue: br
            options:
              - label: Brasil
                value: br
              - label: Portugal
                value: pt
              - label: Estados Unidos
                value: us

  - id: projetos
    title: Projetos
    description: Arrays repetem o schema de items e cada linha vira um FormGroup próprio.
    fields:
      - name: habilidades
        label: Habilidades
        type: array
        minItems: 1
        maxItems: 5
        items:
          type: enum
          widget: select
          options:
            - label: Angular
              value: angular
            - label: TypeScript
              value: typescript
            - label: Node.js
              value: node
            - label: SQL
              value: sql
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
            - name: link
              label: Link
              type: string
              widget: url
            - name: papel
              label: Papel
              type: enum
              options:
                - label: Autor
                  value: autor
                - label: Revisor
                  value: revisor
            - name: ativo
              label: Em produção
              type: boolean
              defaultValue: true

  - id: documento
    title: Documento
    description: visibleWhen liga a exibição de um campo ao valor de outro campo.
    fields:
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
          - label: Estrangeiro
            value: estrangeiro
      - name: cpf
        label: CPF
        type: string
        required: true
        placeholder: 000.000.000-00
        visibleWhen:
          field: tipoPessoa
          equals: pf
      - name: cnpj
        label: CNPJ
        type: string
        required: true
        placeholder: 00.000.000/0000-00
        visibleWhen:
          field: tipoPessoa
          equals: pj
      - name: documentoEstrangeiro
        label: Documento estrangeiro
        type: string
        placeholder: Passaporte ou documento local
        visibleWhen:
          field: tipoPessoa
          equals: estrangeiro

  - id: avancado
    title: Avançado
    description: JSON livre, texto longo e um booleano que precisa estar marcado.
    fields:
      - name: configuracoes
        label: Configurações extras
        type: json
        description: Qualquer JSON válido entra no payload como objeto, array ou primitivo.
      - name: observacoes
        label: Observações
        type: string
        widget: textarea
      - name: aceite
        label: Aceito os termos
        type: boolean
        required: true
`;

const MINIMAL_JSON = `{
  "id": "contato",
  "title": "Contato rápido",
  "description": "O menor schema possível, com validação e widget declarados.",
  "submitLabel": "Enviar mensagem",
  "sections": [
    {
      "id": "contato",
      "title": "Contato",
      "fields": [
        {
          "name": "assunto",
          "label": "Assunto",
          "type": "string",
          "required": true,
          "rules": { "minLength": 4 }
        },
        {
          "name": "email",
          "label": "E-mail",
          "type": "string",
          "widget": "email",
          "required": true
        }
      ]
    }
  ]
}`;

const INVALID_JSON = `{
  "id": "invalido",
  "title": "Schema inválido",
  "description": "Este exemplo mostra o formulário falhando de forma explícita.",
  "sections": [
    {
      "id": "quebrado",
      "title": "Quebrado",
      "fields": [
        { "name": "preco", "label": "Preço", "type": "money" },
        { "name": "status", "label": "Status", "type": "enum" },
        { "name": "valido", "label": "Campo válido", "type": "string" }
      ]
    }
  ]
}`;

export const SCHEMA_SAMPLES: readonly SchemaSample[] = [
  {
    id: 'completo',
    label: 'Cadastro completo',
    summary: 'Seis seções, todos os widgets, objetos aninhados, arrays e condicionais.',
    format: 'yaml',
    source: COMPLETE_YAML,
  },
  {
    id: 'minimo',
    label: 'Formulário mínimo',
    summary: 'Dois campos em JSON para mostrar o menor contrato possível.',
    format: 'json',
    source: MINIMAL_JSON,
  },
  {
    id: 'invalido',
    label: 'Schema inválido',
    summary: 'Tipo desconhecido e enum sem options para demonstrar os erros do parser.',
    format: 'json',
    source: INVALID_JSON,
  },
];

export const DEFAULT_SCHEMA_SAMPLE = SCHEMA_SAMPLES[0];
