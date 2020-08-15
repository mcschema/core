import {
  BooleanNode,
  Case,
  ChoiceNode,
  EnumNode as RawEnumNode,
  Force,
  Has,
  Keep,
  ListNode,
  Mod,
  NumberNode,
  ObjectNode,
  Reference as RawReference,
  Resource,
  StringNode,
  Switch,
  SchemaRegistry,
  CollectionRegistry,
  Opt,
} from '@mcschema/core'


export function initTextComponentSchemas(schemas: SchemaRegistry, collections: CollectionRegistry) {
  const Reference = RawReference.bind(undefined, schemas)
  const EnumNode = RawEnumNode.bind(undefined, collections)

  const getSimpleString = (jsonText: any): string => jsonText instanceof Array ? getSimpleString(jsonText[0]) : jsonText?.text ?? jsonText?.toString() ?? ''

  schemas.register('text_component', Mod(ChoiceNode([
    {
      type: 'object',
      node: Reference('text_component_object'),
      change: v => v instanceof Array ? (typeof v[0] === 'object' ? v[0] : { text: getSimpleString(v[0]) }) : typeof v === 'object' ? v : { text: getSimpleString(v) }
    },
    {
      type: 'list',
      node: Reference('text_component_list'),
      change: v => [v]
    },
    {
      type: 'string',
      node: StringNode(),
      change: getSimpleString
    },
    {
      type: 'number',
      node: NumberNode(),
      change: v => {
        const n = parseFloat(getSimpleString(v))
        return isFinite(n) ? n : (!!v ? 1 : 0)
      }
    },
    {
      type: 'boolean',
      node: BooleanNode({ radio: true }),
      change: v => {
        const s = getSimpleString(v)
        return s === 'true' || s === 'false' ? s === 'true' : !!s
      }
    }
  ], { context: 'text_component' }), {
    default: () => ({
      text: ""
    })
  }))

  schemas.register('text_component_object', Mod(ObjectNode({
    text: Opt(Keep(StringNode())),
    translate: Opt(Keep(StringNode())),
    with: Opt(Reference('text_component_list')),
    score: Opt(ObjectNode({
      name: StringNode({ validation: { validator: 'entity', params: { amount: 'single', type: 'entities', isScoreHolder: true } } }),
      objective: StringNode({ validation: { validator: 'objective' } }),
      value: Opt(StringNode())
    })),
    selector: Opt(StringNode({ validation: { validator: 'entity', params: { amount: 'multiple', type: 'entities' } } })),
    keybind: Opt(EnumNode('keybind', { additional: true })),
    nbt: Opt(StringNode({ validation: { validator: 'nbt_path' } })),
    interpret: Opt(Has('nbt', BooleanNode())),
    block: Has('nbt', StringNode({ validation: { validator: 'vector', params: { dimension: 3, isInteger: true } } })),
    entity: Has('nbt', StringNode({ validation: { validator: 'entity', params: { amount: 'single', type: 'entities' } } })),
    storage: Has('nbt', Resource(StringNode({ validation: { validator: 'resource', params: { pool: '$storage' } } }))),
    extra: Opt(Reference('text_component_list')),
    color: Opt(StringNode()) /* TODO */,
    font: Opt(Resource(StringNode())),
    bold: Opt(BooleanNode()),
    italic: Opt(BooleanNode()),
    underlined: Opt(BooleanNode()),
    strikethrough: Opt(BooleanNode()),
    obfuscated: Opt(BooleanNode()),
    insertion: Opt(StringNode()),
    clickEvent: Opt(ObjectNode({
      action: EnumNode(['open_url', 'open_file', 'run_command', 'suggest_command', 'change_page', 'copy_to_clipboard']),
      [Switch]: path => path.push('action'),
      [Case]: {
        'change_page': {
          value: StringNode()
        },
        'copy_to_clipboard': {
          value: StringNode()
        },
        'open_file': {
          value: StringNode()
        },
        'open_url': {
          value: StringNode()
        },
        'run_command': {
          value: StringNode({ validation: { validator: 'command', params: { leadingSlash: true, allowPartial: true } } })
        },
        'suggest_command': {
          value: StringNode({ validation: { validator: 'command', params: { leadingSlash: true, allowPartial: true } } })
        }
      }
    })),
    hoverEvent: Opt(ObjectNode({
      action: EnumNode(['show_text', 'show_item', 'show_entity']),
      [Switch]: path => path.push('action'),
      [Case]: {
        'show_text': {
          value: Opt(Reference('text_component')),
          contents: Opt(Reference('text_component'))
        },
        'show_item': {
          value: Opt(StringNode({ validation: { validator: 'nbt', params: { module: 'util::InventoryItem' } } })),
          contents: Opt(ObjectNode({
            id: Resource(EnumNode('item', { search: true, validation: { validator: 'resource', params: { pool: 'minecraft:item' } } })),
            count: Opt(NumberNode({ integer: true })),
            tag: Opt(StringNode({ validation: { validator: 'nbt', params: { registry: { category: 'minecraft:item', id: ['pop', { push: 'id' }] } } } }))
          }))
        },
        'show_entity': {
          value: Opt(ObjectNode({
            name: Opt(StringNode()),
            type: Opt(StringNode()),
            id: Opt(StringNode())
          })),
          contents: Opt(Mod(ObjectNode({
            name: Opt(Reference('text_component')),
            type: Resource(EnumNode('entity_type', { search: true, validation: { validator: 'resource', params: { pool: 'minecraft:entity_type' } } })),
            id: StringNode({ validation: { validator: 'uuid' } })
          }), {
            default: () => ({
              type: 'minecraft:pig',
              id: '00000001-0001-0001-0001-000000000001'
            })
          }))
        }
      }
    }))
  }, { context: 'text_component_object', collapse: true }), {
    default: () => ({
      text: ""
    })
  }))

  schemas.register('text_component_list', Mod(ListNode(
    Reference('text_component')
  ), {
    default: () => [{
      text: ""
    }]
  }))
}
