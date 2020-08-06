import {
  BooleanNode,
  Case,
  ChoiceNode,
  EnumNode as RawEnumNode,
  Force,
  INode,
  ListNode,
  MapNode,
  Mod,
  NumberNode,
  ObjectNode,
  Reference as RawReference,
  Resource,
  StringNode,
  Switch,
  SchemaRegistry,
  CollectionRegistry
} from '@mcschema/core'
import { Range } from './Common'

export function initAdvancementSchemas(schemas: SchemaRegistry, collections: CollectionRegistry) {
  const Reference = RawReference.bind(undefined, schemas)
  const EnumNode = RawEnumNode.bind(undefined, collections)

  const PredicateChoice = (node: INode<any>): INode<any> => {
    return ChoiceNode([
      {
        type: 'object',
        node,
        change: v => v[0]?.predicate ?? ({})
      },
      {
        type: 'list',
        node: ListNode(Reference('condition')),
        change: v => [{
          condition: 'minecraft:entity_properties',
          predicate: v
        }]
      }
    ], { choiceContext: 'conditions' })
  }

  schemas.register('advancement', Mod(ObjectNode({
    display: ObjectNode({
      icon: Force(ObjectNode({
        item: Force(Resource(EnumNode('item', { validation: { validator: 'resource', params: { pool: 'minecraft:item' } } }))),
        nbt: StringNode({ validation: { validator: 'nbt', params: { registry: { category: 'minecraft:item', id: ['pop', { push: 'item' }] } } } })
      })),
      title: Force(Reference('text_component')),
      description: Force(Reference('text_component')),
      background: StringNode(),
      frame: EnumNode(['task', 'challenge', 'goal']),
      show_toast: BooleanNode(),
      announce_to_chat: BooleanNode(),
      hidden: BooleanNode()
    }, { collapse: true }),
    parent: StringNode({ validation: { validator: 'resource', params: { pool: '$advancement' } } }),
    criteria: MapNode(
      StringNode(),
      Reference('advancement_criteria')
    ),
    requirements: ListNode(
      ListNode(
        StringNode()
      )
    ),
    rewards: ObjectNode({
      function: StringNode({ validation: { validator: 'resource', params: { pool: '$function' } } }),
      loot: ListNode(
        StringNode({ validation: { validator: 'resource', params: { pool: '$loot_table' } } })
      ),
      recipes: ListNode(
        StringNode({ validation: { validator: 'resource', params: { pool: '$recipe' } } })
      ),
      experience: NumberNode({ integer: true })
    }, { collapse: true }),
  }, { context: 'advancement' }), {
    default: () => ({
      criteria: {
        requirement: {
          trigger: 'minecraft:location'
        }
      }
    })
  }))

  schemas.register('advancement_criteria', ObjectNode({
    trigger: Force(Resource(EnumNode('advancement_trigger', { validation: { validator: 'resource', params: { pool: collections.get('advancement_trigger') } } }))),
    conditions: ObjectNode({
      player: Mod(PredicateChoice(
        Reference('entity_predicate', { collapse: true })
      ), {
        enabled: path => path.pop().push('trigger').get() !== 'minecraft:impossible'
      }),
      [Switch]: path => path.pop().push('trigger'),
      [Case]: {
        'minecraft:bee_nest_destroyed': {
          block: Resource(EnumNode('block', { search: true, validation: { validator: 'resource', params: { pool: 'minecraft:block' } } })),
          num_bees_inside: NumberNode({ integer: true }),
          item: Reference('item_predicate', { collapse: true })
        },
        'minecraft:bred_animals': {
          parent: PredicateChoice(Reference('entity_predicate', { collapse: true })),
          partner: PredicateChoice(Reference('entity_predicate', { collapse: true })),
          child: PredicateChoice(Reference('entity_predicate', { collapse: true }))
        },
        'minecraft:brewed_potion': {
          potion: StringNode({ validation: { validator: 'resource', params: { pool: 'minecraft:potion' } } })
        },
        'minecraft:changed_dimension': {
          from: Resource(StringNode({ validation: { validator: 'resource', params: { pool: '$dimension' } } })),
          to: Resource(StringNode({ validation: { validator: 'resource', params: { pool: '$dimension' } } }))
        },
        'minecraft:channeled_lightning': {
          victims: ListNode(
            PredicateChoice(Reference('entity_predicate'))
          )
        },
        'minecraft:construct_beacon': {
          level: Range()
        },
        'minecraft:consume_item': {
          item: Reference('item_predicate', { collapse: true })
        },
        'minecraft:cured_zombie_villager': {
          villager: PredicateChoice(Reference('entity_predicate', { collapse: true })),
          zombie: PredicateChoice(Reference('entity_predicate', { collapse: true }))
        },
        'minecraft:effects_changed': {
          effects: MapNode(
            Resource(EnumNode('mob_effect', { search: true, validation: { validator: 'resource', params: { pool: 'minecraft:mob_effect' } } })),
            ObjectNode({
              amplifier: Range(),
              duration: Range()
            })
          )
        },
        'minecraft:enter_block': {
          block: Resource(EnumNode('block', { search: true, validation: { validator: 'resource', params: { pool: 'minecraft:block' } } })),
          state: MapNode(
            StringNode(),
            StringNode(),
            { validation: { validator: 'block_state_map', params: { id: ['pop', { push: 'block' }] } } }
          )
        },
        'minecraft:enchanted_item': {
          levels: Range(),
          item: Reference('item_predicate', { collapse: true })
        },
        'minecraft:entity_hurt_player': {
          damage: Reference('damage_predicate', { collapse: true })
        },
        'minecraft:entity_killed_player': {
          entity: PredicateChoice(Reference('entity_predicate', { collapse: true })),
          killing_blow: Reference('damage_source_predicate', { collapse: true })
        },
        'minecraft:filled_bucket': {
          item: Reference('item_predicate', { collapse: true })
        },
        'minecraft:fishing_rod_hooked': {
          entity: PredicateChoice(Reference('entity_predicate', { collapse: true })),
          item: Reference('item_predicate', { collapse: true })
        },
        'minecraft:hero_of_the_village': {
          location: Reference('location_predicate', { collapse: true })
        },
        'minecraft:inventory_changed': {
          slots: ObjectNode({
            empty: Range(),
            occupied: Range(),
            full: Range()
          }),
          items: ListNode(
            Reference('item_predicate')
          )
        },
        'minecraft:item_durability_changed': {
          delta: Range(),
          durability: Range(),
          item: Reference('item_predicate', { collapse: true })
        },
        'minecraft:item_used_on_block': {
          item: Reference('item_predicate', { collapse: true }),
          location: Reference('location_predicate', { collapse: true })
        },
        'minecraft:killed_by_crossbow': {
          unique_entity_types: Range(),
          victims: ListNode(
            PredicateChoice(Reference('entity_predicate'))
          )
        },
        'minecraft:levitation': {
          distance: Range(),
          duration: Range()
        },
        'minecraft:location': {
          location: Reference('location_predicate', { collapse: true })
        },
        'minecraft:nether_travel': {
          distance: Range(),
          entered: Reference('location_predicate', { collapse: true }),
          exited: Reference('location_predicate', { collapse: true })
        },
        'minecraft:placed_block': {
          block: Resource(EnumNode('block', { search: true, validation: { validator: 'resource', params: { pool: 'minecraft:block' } } })),
          state: MapNode(
            StringNode(),
            StringNode(),
            { validation: { validator: 'block_state_map', params: { id: ['pop', { push: 'block' }] } } }
          ),
          item: Reference('item_predicate', { collapse: true }),
          location: Reference('location_predicate', { collapse: true })
        },
        'minecraft:player_generates_container_loot': {
          loot_table: StringNode({ validation: { validator: 'resource', params: { pool: '$loot_table' } } })
        },
        'minecraft:player_hurt_entity': {
          damage: Reference('damage_predicate', { collapse: true }),
          entity: PredicateChoice(Reference('entity_predicate', { collapse: true }))
        },
        'minecraft:player_killed_entity': {
          entity: PredicateChoice(Reference('entity_predicate', { collapse: true })),
          killing_blow: Reference('damage_source_predicate', { collapse: true })
        },
        'minecraft:recipe_unlocked': {
          recipe: StringNode({ validation: { validator: 'resource', params: { pool: '$recipe' } } })
        },
        'minecraft:slept_in_bed': {
          location: Reference('location_predicate', { collapse: true })
        },
        'minecraft:slide_down_block': {
          block: Resource(EnumNode('block', { search: true, validation: { validator: 'resource', params: { pool: 'minecraft:block' } } }))
        },
        'minecraft:shot_crossbow': {
          item: Reference('item_predicate', { collapse: true })
        },
        'minecraft:summoned_entity': {
          entity: PredicateChoice(Reference('entity_predicate', { collapse: true }))
        },
        'minecraft:tame_animal': {
          entity: PredicateChoice(Reference('entity_predicate', { collapse: true }))
        },
        'minecraft:target_hit': {
          projectile: PredicateChoice(Reference('entity_predicate', { collapse: true })),
          shooter: PredicateChoice(Reference('entity_predicate', { collapse: true })),
          signal_strength: Range({ integer: true })
        },
        'minecraft:thrown_item_picked_up_by_entity': {
          entity: Reference('entity_predicate', { collapse: true }),
          item: Reference('item_predicate', { collapse: true })
        },
        'minecraft:used_ender_eye': {
          distance: Range()
        },
        'minecraft:used_totem': {
          item: Reference('item_predicate', { collapse: true })
        },
        'minecraft:villager_trade': {
          villager: Reference('entity_predicate', { collapse: true }),
          item: Reference('item_predicate', { collapse: true })
        },
        'minecraft:voluntary_exile': {
          location: Reference('location_predicate', { collapse: true })
        }
      }
    }, { context: 'criterion' })
  }, { category: 'predicate', context: 'criterion' }))
}
