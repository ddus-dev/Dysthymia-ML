const kmeans = require('node-kmeans');

const algorithm = async (splitData, averageSplitData) => {
    const centroids = await dataSplittingForKmeans(splitData);
    const levelRangeWithLowHigh = findRange(centroids, averageSplitData);
    const weekDate = getWeek(splitData);
    const score = getScore(averageSplitData, levelRangeWithLowHigh);
    console.log(score);
    console.log(weekDate);
}

// Finding centroids
const dataSplittingForKmeans = async (data) => {
    let allDataCentroids = {};

    allDataCentroids.unlocks = await centroidArray(data.unlocks.remainData);
    allDataCentroids.screenOnTime = await centroidArray(data.screenOnTime.remainData);
    allDataCentroids.notifications = await centroidArray(data.notifications.remainData);
    allDataCentroids.activitiesOverallData = await centroidArray(data.activitiesOverallData.remainData);
    allDataCentroids.callStats = await centroidArray(data.callStats.remainData);
    allDataCentroids.usageStats = await centroidArray(data.usageStats.remainData);
    allDataCentroids.stepCounter = await centroidArray(data.stepCounter.remainData);
    allDataCentroids.sleepHours = await centroidArray(data.sleepHours.remainData);
    return allDataCentroids;
}

// find centroid for particular data
const centroidArray = (data) => {
    return new Promise((resolve, reject) => {
        let centroids = [0,0,0,0];
        let vectors = new Array();

        for (let i = 0 ; i < data.length ; i++) {
            vectors[i] = [ data[i]['value']];
        }
        kmeans.clusterize(vectors, {k: 4}, (err,res) => {
            if(!err){
                for (let i = 0 ; i < 4 ; i++) {
                    centroids[i] = Math.floor(res[i].centroid[0] * 1000) / 1000;
                }
                resolve(centroids);
            }
        });
    });
}

// outputs level and low and high w.r.t average remaining data
const findRange = (centroids, averageSplitData) => {
    minDistCentroid = findDistanceBetweenCentroids(centroids);
    closerCentroid = centroidClosertoAvgRemainData(averageSplitData, centroids);
    levelAndLowHigh = getRange(minDistCentroid, averageSplitData);
    return levelAndLowHigh;
}

// Comparing numbers useful for sorting centroid
const numberComparator = (firstNumber, secondNumber) => {
    return firstNumber - secondNumber;
}

// find distance between centroids
// returns array containing distnce beteen centroids
const findDistanceBetweenCentroids = (data) => {
    let distance = {};
    let checkDist = 0;
    Object.keys(data).forEach((e, index) => {
        data[e].sort(numberComparator);
        data[e].reverse(numberComparator);
        let min = data[e][0];
        for(let i=0; i<3; i++) {
            checkDist = data[e][i] - data[e][i+1];
            if(checkDist < min) {
                min = checkDist;
            }
        }
        distance[e] = Math.floor(min * 1000) / 1000;
    })
    return distance;
}

// finds centroid to average remain data
// returns array of centroid closer to particular average remain data
const centroidClosertoAvgRemainData = (averageSplitData, centroids) => {
    let closerCentroid = {};
    let j = 0;
    Object.keys(centroids).forEach((e, index) => {
        let needle = averageSplitData[e][0];
        const closest = centroids[e].reduce((a, b) => {
            return Math.abs(b - needle) < Math.abs(a - needle) ? b : a;
        });
        closerCentroid[e] = closest;
        j++;
    });
    return closerCentroid;
}

// provides level of each data including low and high
const getRange = (minDistCentroid, averageSplitData) => {
    let levelAndLowHigh = [];
    let level = {};
    let lowHigh = {};

    Object.keys(minDistCentroid).forEach((e, index) => {
        let level0Range = averageSplitData[e][0] - minDistCentroid[e];
        let level1Range = averageSplitData[e][0] - (minDistCentroid[e]*2);
        let level2Range = averageSplitData[e][0] - (minDistCentroid[e]*3);
        if(level0Range < 0 || level1Range < 0 || level2Range < 0) {
            minDistCentroid[e] = minDistCentroid[e] * 0.25;
        }
        
        if(averageSplitData[e][1] >= (averageSplitData[e][0] - minDistCentroid[e]) && averageSplitData[e][1] <= (averageSplitData[e][0] + minDistCentroid[e])) {
            level[e] = 0;
            if(averageSplitData[e][1] < averageSplitData[e][0]) {
                lowHigh[e] = 0;
            } else {
                lowHigh[e] = 1;
            }
        } else if(averageSplitData[e][1] >= (averageSplitData[e][0] - (minDistCentroid[e]*2)) && averageSplitData[e][1] <= (averageSplitData[e][0] + (minDistCentroid[e]*2))) {
            level[e] = 1;
            if(averageSplitData[e][1] < averageSplitData[e][0]) {
                lowHigh[e] = 0;
            } else {
                lowHigh[e] = 1;
            }
        } else if(averageSplitData[e][1] >= (averageSplitData[e][0] - (minDistCentroid[e]*3)) && averageSplitData[e][1] <= (averageSplitData[e][0] + (minDistCentroid[e]*3))) {
            level[e] = 2;
            if(averageSplitData[e][1] < averageSplitData[e][0]) {
                lowHigh[e] = 0;
            } else {
                lowHigh[e] = 1;
            }
        } else {
            level[e] = 3;
            if(averageSplitData[e][1] < averageSplitData[e][0]) {
                lowHigh[e] = 0;
            } else {
                lowHigh[e] = 1;
            }
        }
    })
    levelAndLowHigh.level = level;
    levelAndLowHigh.lowHigh = lowHigh;
    return levelAndLowHigh;
}

const getWeek = (splitData) => {
    let obj = {};
    obj.startDate = splitData.unlocks.recentData[0].date;
    obj.endDate = splitData.unlocks.recentData[6].date;
    return obj;
}

const getScore = (averageSplitData, levelAndLowHigh) => {
    let totalScore = 0;
    let score = [0, 0, 0, 0, 0, 0, 0, 0];

    // 1st question
    score[0] += levelAndLowHigh.level.screenOnTime * 17;
    score[0] += levelAndLowHigh.level.sleepHours * 12;
    score[0] += levelAndLowHigh.level.unlocks * 17;
    score[0] += levelAndLowHigh.level.callStats * 17;
    score[0] += levelAndLowHigh.level.notifications * 8;
    score[0] += levelAndLowHigh.level.usageStats * 17;
    score[0] += levelAndLowHigh.level.stepCounter * 12;
    score[0] = Math.round(score[0] / 100);
    totalScore += score[0];

    // 3rd question
    score[2] = levelAndLowHigh.level.sleepHours;
    totalScore += score[2];

    // 4th question
    if(levelAndLowHigh.lowHigh.screenOnTime == 0) {
        score[3] += levelAndLowHigh.level.screenOnTime * 14;
    }
    if(levelAndLowHigh.lowHigh.unlocks == 0) {
        score[3] += levelAndLowHigh.level.unlocks * 14;
    }
    if(levelAndLowHigh.lowHigh.callStats == 0) {
        score[3] += levelAndLowHigh.level.callStats * 10;
    }
    if(levelAndLowHigh.lowHigh.usageStats == 0) {
        score[3] += levelAndLowHigh.level.usageStats * 14;
    }
    if(levelAndLowHigh.lowHigh.stepCounter == 0) {
        score[3] += levelAndLowHigh.level.stepCounter * 24;
    }
    score[3] += averageSplitData.activitiesOverallData[1] * 24;
    score[3] = Math.round(score[3] / 100);
    totalScore += score[3];

    // 5th question
    score[4] += levelAndLowHigh.level.stepCounter * 33.33;
    score[4] += averageSplitData.activitiesOverallData[1] * 33.33;
    score[4] += levelAndLowHigh.level.sleepHours * 33.33;
    score[4] = Math.round(score[4] / 100);
    totalScore += score[4];
    
    // 6th question
    if(levelAndLowHigh.lowHigh.screenOnTime == 0) {
        score[5] += levelAndLowHigh.level.screenOnTime * 25;
    }
    if(levelAndLowHigh.lowHigh.usageStats == 0) {
        score[5] += levelAndLowHigh.level.usageStats * 15;
    }
    if(levelAndLowHigh.lowHigh.callStats == 0) {
        score[5] += levelAndLowHigh.level.callStats * 30;
    }
    if(levelAndLowHigh.lowHigh.sleepHours == 0) {
        score[5] += levelAndLowHigh.level.sleepHours * 30;
    }
    score[5] = Math.round(score[5] / 100);
    totalScore += score[5];
    
    // 7th question
    if(levelAndLowHigh.lowHigh.screenOnTime == 1) {
        score[6] += levelAndLowHigh.level.screenOnTime * 40;
    }
    if(levelAndLowHigh.lowHigh.usageStats == 0) {
        score[6] += levelAndLowHigh.level.usageStats * 40;
    }
    if(levelAndLowHigh.lowHigh.callStats == 0) {
        score[6] += levelAndLowHigh.level.callStats * 20;
    }
    score[6] = Math.round(score[6] / 100);
    totalScore += score[6];
    
    // 8th question
    score[7] += levelAndLowHigh.level.stepCounter * 30;
    score[7] += averageSplitData.activitiesOverallData[1] * 30;
    score[7] += levelAndLowHigh.level.callStats * 40;
    score[7] = Math.round(score[7] / 100);
    totalScore += score[7];

    // 2nd question
    score[1] = Math.round((score[0] + score[2] + score[3] + score[4] + score[5] + score[6] + score[7]) / 7);
    totalScore += score[1];
    return totalScore;
}

module.exports = {
    algorithm
}