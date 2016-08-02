'use strict'

const Pokemon = require('./pokemon.json')
const Moves = require('./moves.json')
const LevelToCPM = require('./level-to-cpm.json')

function findPokemon(name) {
  const fmtName = name.toUpperCase()

  return Object.keys(Pokemon).reduce((a, key) => {
    if (a) return a
    if (Pokemon[key].name === fmtName) return Pokemon[key]
    return null
  }, null)
}

const DustToLevel = {
  200: [1, 1.5, 2, 2.5],
  400: [3, 3.5, 4, 4.5],
  600: [5, 5.5, 6, 6.5],
  800: [7, 7.5, 8, 8.5],
  1000: [9, 9.5, 10, 10.5],
  1300: [11, 11.5, 12, 12.5],
  1600: [13, 13.5, 14, 14.5],
  1900: [15, 15.5, 16, 16.5],
  2200: [17, 17.5, 18, 18.5],
  2500: [19, 19.5, 20, 20.5],
  3000: [21, 21.5, 22, 22.5],
  3500: [23, 23.5, 24, 24.5],
  4000: [25, 25.5, 26, 26.5],
  4500: [27, 27.5, 28, 28.5],
  5000: [29, 29.5, 30, 30.5],
  6000: [31, 31.5, 32, 32.5],
  7000: [33, 33.5, 34, 34.5],
  8000: [35, 35.5, 36, 36.5],
  9000: [37, 37.5, 38, 38.5],
  10000: [39, 39.5, 40, 40.5],
}

function calcIndSta(hp, BaseSta, ECpM) {
  return Array.from(Array(15))
    .map((_, i) => i)
    .filter(IndSta => hp === Math.floor(ECpM * (BaseSta + IndSta)))
}

function getCP(mon, ivs, ECpM) {
  const BaseAtk = mon.stats.attack
  const BaseDef = mon.stats.defense
  const BaseSta = mon.stats.stamina
  const IndAtk = ivs.atk
  const IndDef = ivs.def
  const IndSta = ivs.sta

  return Math.floor(
    (BaseAtk + IndAtk) *
    Math.pow(BaseDef + IndDef, 0.5) *
    Math.pow(BaseSta + IndSta, 0.5) *
    Math.pow(ECpM, 2) /
    10
  )
}

function maxCP(mon) {
  return getCP(mon, {
    atk: 15,
    def: 15,
    sta: 15,
  }, 0.790300)
}

function calculate(pokemonName, cp, hp, stardust, Level) {
  const mon = findPokemon(pokemonName)

  const BaseSta = mon.stats.stamina

  const ECpM = LevelToCPM[String(Level)]

  if (DustToLevel[stardust].indexOf(Level) === -1) {
    throw new Error('Stardust does not match level')
  }

  const IndStaValues = calcIndSta(hp, BaseSta, ECpM)

  const possibleValues = []
  IndStaValues.forEach((IndSta) => {
    for (let IndAtk = 0; IndAtk <= 15; IndAtk += 1) {
      for (let IndDef = 0; IndDef <= 15; IndDef += 1) {
        const CP = getCP(mon, {
          atk: IndAtk,
          def: IndDef,
          sta: IndSta,
        }, ECpM)
        const Total = IndAtk + IndDef

        const Perfect = Math.round((Total + IndSta) / 45 * 100)

        if (cp === CP) {
          possibleValues.push({
            pokemonName,
            IndAtk,
            IndDef,
            IndSta,
            Total,
            Perfect,
          })
        }
      }
    }
  })

  return possibleValues
}

// Ok mostly works...
//console.log(calculate('bulbasaur', 596, 62, 20))
//console.log(calculate('growlithe', 666, 65, 19))
console.log(calculate('omastar', 1622, 103, 4000, 25.5))
