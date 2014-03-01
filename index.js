//
// Unik
// ==================================
// http://github.com/ricardobeat/unik
//
// Copyright 2013 Ricardo Tomasi <ricardobeat@gmail.com>
// MIT Licensed - http://ricardo.mit-license.org

// ----------------------------------------------------------------------------

function fillRight (str, length, char) {
    var ln = length - str.length
    while (ln-- > 0) str += char || '0'
    return str
}

// ----------------------------------------------------------------------------

function Unik (options) {
    // Max date is new Date(epochStart + Math.pow(2,41)) => Sat Sep 06 2081 12:47:35 GMT-0300 (BRT)
    this.epoch   = options && options.epoch || Date.parse('2012')
    this.base    = options && options.base || 36
    this.sep     = options && options.sep != null ? options.sep : '-'
    this.seed    = options && options.seeed || Math.floor(Math.random() * Math.pow(2, 20))
    this.maxTime = 0
    this.counter = 0
    this.digitSymbols = options && options.digitSymbols || ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
    this.reverse = options && options.reverse || false
    this.unique  = process.pid
    this.append  = null
}

Unik.create = function (options) {
    return new Unik(options)
}

Number.prototype.toBase = function (base, symbols) {

    var decimal = this
      , conversion = ""

    if (base > symbols.length) {
        return false
    }

    else if (base < 37) {
        return decimal.toString(base)
    }

    else {
        while (decimal >= 1) {
            conversion = symbols[(decimal - (base*Math.floor(decimal / base)))] + conversion
            decimal = Math.floor(decimal / base)
        }
        return conversion
    }
}

// flake
// ----------------------------------------------------------------------------
// time (ms)        41 bits    *2199023255552
// -
// time (ns)        13 bits    *8192
// process id       10 bits    *1024
// ----------------------------------------------------------------------------
//                  64 bits     18,446,744,073,709,551,616

Unik.prototype.flake = function () {
    var now  = Date.now() - this.epoch
      , base = this.base
      , symbols = this.digitSymbols
      , max  = this.maxTime
      , sequence, id

    if (this.counter > 8191 || now < max) {
        if (now < max) {
            console.error('Clock went backwards! ' + now + ' < ' + max)
        } else {
            console.error('Sequence overflow: ' + this.counter)
        }
        console.error('Holding up id generation until next clock tick.')
        while (true) {
            now = Date.now() - this.epoch
            if (now > max) break
        }
    }

    if (now > max) {
        this.counter = 0
        this.maxTime = now
    }

    now = parseInt(fillRight(now.toString(2), 41), 2)
    sequence = (++this.counter) << 10 | this.unique % 1024

    // if the 'reverse' option is toggled, the sequence goes before the base
    id = (!this.reverse) ? now.toBase(base, symbols) + this.sep + sequence.toBase(base, symbols) : sequence.toBase(base, symbols) + this.sep + now.toBase(base, symbols)
    if (this.append) id += this.sep + this.append

    return id
}

// bigflake
// ----------------------------------------------------------------------------
// time (ms)        53 bits    *9007199254740992
// -
// time (ns)        23 bits    *8388608
// process id       20 bits    *1048576
// ----------------------------------------------------------------------------
//                  96 bits     79,228,162,514,264,337,593,543,950,336

Unik.prototype.bigflake = function () {
    var now  = Date.now()
      , base = this.base
      , symbols = this.digitSymbols
      , max  = this.maxTime
      , ns, id

    if (now < max) {
        console.error('Clock went backwards! ' + now + ' < ' + max)
        console.error('Holding up id generation until next clock tick.')
        while (true) {
            now = Date.now() - this.epoch
            if (now > max) break
        }
    }

    if (now > max) {
        this.maxTime = now
    }

    ns = process.hrtime()[1] >> 7
    // bitwise operations max at 32 bits, so concat bits by hand
    sequence = parseInt(ns.toString(2) + this.seed.toString(2), 2)

    id = (!this.reverse) ? now.toBase(base, symbols) + this.sep + sequence.toBase(base, symbols) : sequence.toBase(base, symbols) + this.sep + now.toBase(base, symbols)
    if (this.append) id += this.sep + this.append

    return id
}

// ----------------------------------------------------------------------------

module.exports = Unik
