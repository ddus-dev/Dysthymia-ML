const axios = require('axios');
const mlData = require('./mlData');

axios.get('https://desolate-springs-80998.herokuapp.com/stats/get', {headers: {
    'x-auth': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZTQwMTdiMjcxM2NmOTAwMTY4OGI1NTciLCJhY2Nlc3MiOiJBdXRoIiwiaWF0IjoxNTg0OTc3MTY5fQ.h4zjdMBgs2Dyza6ZQk5W6Q2MyT1k069JDgw3VO-8WXU'
}})
.then(res=> {
    mlData.rawData(res.data.data);
})
.catch(e=> {
    console.log(e.response);
})
