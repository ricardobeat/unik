unik
====

unik generates unique sortable IDs that can be used by multiple processes simultaneously, without
any communication between them. It is based on the [Snowflake](https://github.com/twitter/snowflake/) design
and inspired by the article [Sharding IDs at Instagram](http://instagram-engineering.tumblr.com/post/10853187575/sharding-ids-at-instagram).

Install
-------

    npm install unik --save

Make sure you specify the unik version in your `package.json`.

Usage
-----

    var Unik = require('unik')
       , db  = require('mydb')

    var unik = new Unik()

    db.put(unik.flake(), data, function (err, res) { ... })

The `Unik` constructor also has a `.create` shortcut for convenience:

    var unik = require('unik').create()

    var id = unik.flake()

The constructor takes an options argument:

    new Unik({
        // base: use `10` to get the ID as an integer
        base: 36
        // unique: unique identifier < 1024 for `unik.flake()`. Use `.workerID` in a cluster, for example.
        unique: process.pid % 1024
        // seed: random seed OR unique identifier for `unik.bigflake()`
        seed: random 0-1048576
        // separator. Set to '' to get a string w/o breaks (makes timestamp not extractable)
        sep: '-'
        // epoch: custom start epoch. If you change this the resulting dates must fit in 41 bits
        // Defaults to Sun, 01 Jan 2012 00:00:00 GMT
        epoch: 1325376000000
        // If set, will be appended to the end of the ID using `.separator`; useful if you need to store
        // some data in the key itself. Resulting key length will be dependent on this value.
        append: ''
    })

### unik.flake()

[Snowflake](https://github.com/twitter/snowflake/)-inspired 64-bit IDs. Uses a custom epoch start, the `.unique` option along with an internal counter for generating up to 8191 ids/ms.

<table>
    <tr>
        <th>Input</th>
        <th>Size</th>
    </tr>
    <tr>
        <td>Time (milliseconds)</td>
        <td>41 bits</td>
    </tr>
    <tr>
        <td>Counter sequence</td>
        <td>13 bits (*8192)</td>
    </tr>
    <tr>
        <td>Process ID / unique</td>
        <td>10 bits (*1024)</td>
    </tr>
</table>

Due to javascript's 53-bit integer limit, the ID is split in two parts, time-counter|pid.

`.flake` can generate a total of `18,446,744,073,709,551,616` values.

### unik.bigflake()

96 bit IDs. Uses full unix epoch, node `process.hrtime` nanosecond resolution timer and a random seed, doesn't require a unique identifier.

<table>
    <tr>
        <th>Input</th>
        <th>Size</th>
    </tr>
    <tr>
        <td>Time (milliseconds)</td>
        <td>53 bits</td>
    </tr>
    <tr>
        <td>Time (nanoseconds)</td>
        <td>23 bits (*8388608)</td>
    </tr>
    <tr>
        <td>Random / unique</td>
        <td>20 bits (*1048576)</td>
    </tr>
</table>

 `.bigflake` can generate a total of `79,228,162,514,264,337,593,543,950,336` values.

Sharding
--------

Set the `unique` option to the shard's ID. `.flake` can have up to 1024 shards. If needed, the value can be extracted from the ID by reading the last 10 bits, e.g.:

    var id = unik.flake()
    var shard_id = parseInt(id.split('-')[1], 36) // assuming base 36 and '-' separator

    shard_id = parseInt(shard_id.toString(2).slice(-10), 2)

For `.bigflake` use the `seed` option, up to 1048576 shards.

Performance and collisions
--------------------------

`unik.flake()` can generate 700k ids/second using two workers on a late 2011 MacbookPro:

![A billion unik flakes](http://f.cl.ly/items/0Z2t0Z13443w3Q2q3k3j/Screen%20Shot%202013-04-29%20at%206.49.12%20PM.png)

`unik.bigflake()` is about 3x slower.

The library has built-in protection for backwards-flowing time; if that happens, ID generation will be held back until the next forward clock tick.

Tests
-----

`npm test` or `node test/sharding.js [workers] [burst_size]` is designed to test for collisions using multiple processes. The main process will break when a collision is found.

