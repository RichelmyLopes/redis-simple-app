const express = require('express')
const app = express()

const redis = require('redis')
const client = redis.createClient()


const getAllProducts = async() =>{
    const time = Math.random() * 10000
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(['Produto 1','Produto 2'])
        }, time)
    })
}

app.get('/saved', async (req, res) => {
    await client.del('getAllProducts')
    res.send({ok: true})
})

app.get('/', async (req, res) => {
    const productsFromCache = await client.get('getAllProducts')
    const isproductsFromCacheStale = !(await client.get("getAllProducts:validation"))

    if(isproductsFromCacheStale) {
        const isRefetching =  !!(await client.get('getAllProducts:is-refetching'))
        console.log({isRefetching})
        if(!isRefetching){
            await client.set('getAllProducts:is-refetching', "true", {EX: 20})
            setTimeout( async () => {
                console.log('cache is stale - refetching...')
                const products = await getAllProducts()
                await client.set('getAllProducts',JSON.stringify(products));
                await client.set('getAllProducts:validation', "true", {EX: 5})
                await client.del('getAllProducts:is-refetching')
            }, 0)
        }
    }


    if(productsFromCache){
        return res.send(JSON.parse(productsFromCache))
    }else {
        const products = await getAllProducts()
        await client.set('getAllProducts', JSON.stringify(products))
        res.send(products)
    }
})

const startup = async() => {
    await client.connect();
    app.listen(3005, () => {
        console.log('server running....')
    })
}

startup()

