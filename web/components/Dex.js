const $ = require('../utils/n')
const AppBar = require('material-ui/AppBar').default
const AutoComplete = require('material-ui/AutoComplete').default
const Avatar = require('material-ui/Avatar').default
const BackIcon = require('material-ui/svg-icons/navigation/arrow-back').default
const Chip = require('material-ui/Chip').default
const Divider = require('material-ui/Divider').default
const DustTolevel = require('../../json/dust-to-level.json')
const IconButton = require('material-ui/IconButton').default
const MenuItem = require('material-ui/MenuItem').default
const MovesList = require('../../json/moves.json')
const Paper = require('material-ui/Paper').default
const Pokemon = require('../../json/pokemon.json')
const RaisedButton = require('material-ui/RaisedButton').default
const SearchIcon = require('material-ui/svg-icons/action/search').default
const SelectField = require('material-ui/SelectField').default
const Styles = require('../styles')
const TextField = require('material-ui/TextField').default
const avgComboDPS = require('../../src/avgComboDPS')
const bestVs = require('../../src/bestVs')
const getTypeColor = require('../utils/getTypeColor')
const ovRating = require('../utils/ovRating')
const pokeRatings = require('../utils/pokeRatings')
const { Card, CardActions, CardHeader, CardText } = require('material-ui/Card')
const { List, ListItem } = require('material-ui/List')
const { Tabs, Tab } = require('material-ui/Tabs')
const { View, Text, Row, Col, Image } = require('../utils/Lotus.React')
const { compose, lifecycle, withState } = require('recompose')
const {
  blue300,
  blueGrey50,
  cyan500,
  green400,
  grey50,
  grey800,
  indigo100,
  indigo400,
  red300,
  red400,
  yellow300,
} = require('material-ui/styles/colors')

const sortByAtk = (a, b) => a.info.combo.dps > b.info.combo.dps ? -1 : 1
const sortByDef = (a, b) => a.info.combo.gymDPS > b.info.combo.gymDPS ? -1 : 1

const sortMoves = (pokemon, sortOrder) => (
  pokemon.moves1.reduce((acc, move1) => acc.concat(
    pokemon.moves2.map(move2 => ({
      rate: pokeRatings.getRating(pokemon, move1.Name, move2.Name),
      info: avgComboDPS(pokemon, move1, move2),
    })
  )), []).sort(sortOrder ? sortByAtk : sortByDef)
)

const PokeMoves = Pokemon.reduce((pokes, poke) => {
  pokes[poke.name] = poke.moves1.reduce((obj, move1) => {
    return poke.moves2.reduce((o, move2) => {
      const info = avgComboDPS(poke, move1, move2)
      o[info.quick.name] = info.quick
      o[info.charge.name] = info.charge
      o[info.combo.name] = Object.assign({ meta: info.meta }, info.combo)
      return o
    }, obj)
  }, {})
  return pokes
}, {})

const max = (poke, n, f) => Math.max.apply(
  Math.max,
  [n].concat(
    Object.keys(PokeMoves[poke])
    .map(x => PokeMoves[poke][x])
    .filter(x => x.meta)
    .map(x => f(x))
  )
)

const min = (poke, n, f) => Math.min.apply(
  Math.min,
  [n].concat(
    Object.keys(PokeMoves[poke])
    .map(x => PokeMoves[poke][x])
    .filter(x => x.meta)
    .map(x => f(x))
  )
)

const PokeScale = Object.keys(PokeMoves).reduce((best, poke) => ({
  atk: {
    max: max(poke, best.atk.max, x => x.dps),
    min: min(poke, best.atk.min, x => x.dps),
  },
  def: {
    max: max(poke, best.def.max, x => x.gymDPS),
    min: min(poke, best.def.min, x => x.gymDPS),
  },
}), {
  atk: {
    max: -Infinity,
    min: Infinity,
  },
  def: {
    max: -Infinity,
    min: Infinity,
  },
})

const Moves = MovesList.reduce((moves, move) => {
  moves[move.Name] = move
  return moves
}, {})

// TODO all data should come clean
const ucFirst = x => x[0].toUpperCase() + x.slice(1).toLowerCase()

const Types = {}
const Mon = Pokemon.reduce((obj, mon) => {
  const type1 = mon.type1
  const type2 = mon.type2

  Types[type1] = type1
  if (type2) Types[type2] = type2

  obj[mon.name] = mon
  return obj
}, {})


const isStab = (pokemon, move) => (
  [pokemon.type1, pokemon.type2]
    .filter(Boolean)
    .filter(type => type === move.Type)
    .length > 0
)

const getColor = n => (
  n > 86 ? green400 :
  n > 78 ? yellow300 :
  red400
)

const MoveInfo = ({
  atk,
  def,
  info,
  rate,
}) => (
  $(Paper, {
    style: {
      paddingBottom: 12,
      paddingLeft: 24,
      paddingRight: 24,
      paddingTop: 12,
    },
  }, [
    $(Row, {
      vertical: 'center',
    }, [
      $(Col, [
        $(View, [
          $(Text, info.quick.name),
          $(Text, info.charge.name),
        ]),
      ]),

      $(Col, [
        atk && (
          $(Chip, {
            backgroundColor: blueGrey50,
          }, [
            $(Avatar, {
              backgroundColor: getColor(rate.atk.offenseRating),
              color: grey800,
            }, rate.atk.offenseRating),
            $(Text, rate.atk.dps.toFixed(2)),
          ])
        ),

        def && (
          $(Chip, {
            backgroundColor: blueGrey50,
          }, [
            $(Avatar, {
              backgroundColor: getColor(rate.def.defenseRating),
              color: grey800,
            }, rate.def.defenseRating),
            $(Text, rate.def.gymDPS.toFixed(2)),
          ])
        ),
      ]),
    ]),
  ])
)

const BestInfo = ({
  best,
}) => (
  $(Card, {
  }, [
    $(CardHeader, {
      actAsExpander: best.rest.length > 0,
      showExpandableButton: best.rest.length > 0,
      subtitle: (
        $(View, [
          $(Text, `${best.quickMove} + ${best.chargeMove}`),
          $(Text, `${best.dps} dps | ${best.ttl} ttl`),
        ])
      ),
      title: best.name,
    }),
    $(CardText, {
      expandable: best.rest.length > 0,
    }, best.rest.map(rest => (
      $(CardHeader, {
        title: `${rest.quickMove} + ${rest.chargeMove}`,
        subtitle: (
          $(View, [
            $(Text, `${rest.dps} dps`),
            $(Text, `${rest.ttl} ttl`),
          ])
        ),
      })
    ))),
  ])
)

const BestOpponent = ({
  best,
}) => (
  $(Tabs, [
    $(Tab, {
      label: 'Score',
    }, best
      .sort((a, b) => a.score > b.score ? -1 : 1)
      .map(best => $(BestInfo, { best }))
    ),
    $(Tab, {
      label: 'DPS',
    }, best
      .sort((a, b) => a.dps > b.dps ? -1 : 1)
      .map(best => $(BestInfo, { best }))
    ),
    $(Tab, {
      label: 'TTL',
    }, best
      .sort((a, b) => a.ttl > b.ttl ? -1 : 1)
      .map(best => $(BestInfo, { best }))
    ),
  ])
)

const Module = ({
  title,
  children,
}) => (
  $(Paper, {
    style: {
      marginTop: 40,
    },
  }, [
    title && $(View, {
      style: {
        paddingBottom: 12,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 12,
      },
    }, [
      $(Row, {
        horizontal: 'center',
      }, [
        $(Text, { strong: true }, title),
      ]),
    ])
  ].concat(children, [
    $(Divider),
  ].filter(Boolean)))
)

const PokeInfoComponent = ({
  iv,
  pokemon,
  showIVCalc,
}) => (
  $(View, [
    $(Paper, {
      style: {
        paddingBottom: 12,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 12,
      },
    }, [
      $(Row, {
        vertical: 'center',
      }, [
        $(Col, [
          $(Avatar, {
            backgroundColor: getTypeColor(pokemon),
            src: `images/${pokemon.name}.png`,
            size: 100,
            style: {
              padding: 4,
            },
          })
        ]),

        $(Col, [
          $(Chip, {
            backgroundColor: indigo100,
            style: {
              marginBottom: 4,
            },
          }, [
            $(Avatar, {
              backgroundColor: indigo400,
            }, pokemon.stats.attack),
            $(Text, 'ATK'),
          ]),

          $(Chip, {
            backgroundColor: indigo100,
            style: {
              marginBottom: 4,
            },
          }, [
            $(Avatar, {
              backgroundColor: indigo400,
            }, pokemon.stats.defense),
            $(Text, 'DEF'),
          ]),

          $(Chip, {
            backgroundColor: indigo100,
            style: {
              marginBottom: 4,
            },
          }, [
            $(Avatar, {
              backgroundColor: indigo400,
            }, pokemon.stats.stamina),
            $(Text, 'STA'),
          ]),
        ]),
      ]),
    ]),

//    $(Module, {
//      title: iv ? 'IVs' : null,
//    }, [
//      !iv && (
//        $(View, {
//          style: {
//            paddingBottom: 24,
//            paddingTop: 24,
//          },
//        }, [
//          $(Row, {
//            horizontal: 'center',
//          }, [
//            $(RaisedButton, {
//              label: 'Get IVs',
//              secondary: true,
//              onClick: () => showIVCalc(true),
//            }),
//          ])
//        ])
//      ),
//
//      iv && (
//        $(View, [
//          $(TextField, {
//            hintText: 'CP',
//            type: 'number',
//          }),
//
//          $(TextField, {
//            hintText: 'HP',
//            type: 'number',
//          }),
//
//          $(SelectField, {
//            hintText: 'Stardust',
//          }, Object.keys(DustTolevel)
//            .map(primaryText => $(MenuItem, { primaryText }))
//          ),
//
//          $(Row, {
//            horizontal: 'center',
//          }, [red300, blue300, yellow300].map(backgroundColor => (
//            $(Avatar, {
//              backgroundColor,
//              style: {
//                marginLeft: 32,
//                marginRight: 32,
//              },
//            })
//          ))),
//
//          $(RaisedButton, {
//            label: 'Calculate',
//            primary: true,
//          }),
//        ])
//      ),
//    ]),

    $(Module, {
      title: 'Movesets',
    }, [
      $(Tabs, [
        $(Tab, { label: 'Attacking' }, sortMoves(pokemon, 1).map(res => (
          $(MoveInfo, {
            key: `ATK+${res.info.combo.name}`,
            rate: res.rate,
            info: res.info,
            atk: true,
          })
        ))),

        $(Tab, { label: 'Defending' }, sortMoves(pokemon, 0).map(res => (
          $(MoveInfo, {
            key: `DEF+${res.info.combo.name}`,
            rate: res.rate,
            info: res.info,
            def: true,
          })
        ))),
      ]),
    ]),

    $(Module, {
      title: `Best vs ${ucFirst(pokemon.name)}`,
    }, [
      $(BestOpponent, {
        best: bestVs(pokemon),
      }),
    ]),
  ])
)

const PokeInfo = compose(
  withState('iv', 'showIVCalc', false)
)(PokeInfoComponent)

const dexList = Pokemon.map(x => x.name.replace(/_/g, ' '))

const Dex = ({
  changePokemon,
  pokemon,
}) => (
  $(View, [
    !pokemon && (
      $(Paper, {
        style: {
          alignItems: 'center',
          backgroundColor: cyan500,
          color: '#fff',
          flex: 1,
          display: 'flex',
          height: 64,
        },
      }, [
        $(IconButton, {
          style: {
            position: 'absolute',
          },
          iconStyle: {
            color: '#fff',
          },
        }, [$(SearchIcon)]),
        $(AutoComplete, {
          dataSource: dexList,
          filter: (searchText, key) => key.indexOf(searchText.toUpperCase()) > -1,
          fullWidth: true,
          hintText: 'Search for Pokemon',
          onNewRequest: text => changePokemon(Mon[text.toUpperCase()]),
          textFieldStyle: {
            left: 48,
          },
        })
      ])
    ),
    pokemon && (
      $(AppBar, {
        title: pokemon ? ucFirst(pokemon.name) : null,
        onLeftIconButtonTouchTap: () => changePokemon(null),
        iconElementLeft: $(IconButton, [$(BackIcon)]),
      })
    ),

    // Empty text then list out all the Pokes
    !pokemon && (
      Object.keys(Mon).map(mon => (
        $(View, { style: { display: 'inline-block' } }, [
          $(Image, {
            onClick: () => changePokemon(Mon[mon]),
            src: `images/${mon}.png`,
            height: 60,
            width: 60,
          }),
        ])
      ))
    ),

    // The Pokedex view
    pokemon && $(PokeInfo, { pokemon }),
  ])
)

const hashChanged = () => {
  const arr = window.location.hash.split('/') || ''
  return Pokemon.filter(x => x.name === arr[1].toUpperCase())[0]
}

const changePokemonFromHash = ({
  changePokemon,
}) => changePokemon(hashChanged() || null)


module.exports = compose(
  withState('pokemon', 'changePokemon', null),
  lifecycle({
    componentDidMount() {
      changePokemonFromHash(this.props)
      window.onhashchange = () => changePokemonFromHash(this.props)
    },
  })
)(Dex)
