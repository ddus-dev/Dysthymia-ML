const moment = require('moment');
const mlAlgorithm = require('./mlAlgorithm');

const rawData = (res) => {
    duplicateEliminatedData = getCleanData(res);
    lightActivityFiltered = lightActivityFilteredData(duplicateEliminatedData);
    usageStatsFiltered = usageFilteredData(lightActivityFiltered);
    notificationFiltered = notificationFilteredData(usageStatsFiltered);
    callLogsAddedData = callLogsDataValue(notificationFiltered);
    cleanData = solveMissingDateValue(notificationFiltered);
    sleepAddedCleanData = sleepDataValue(cleanData);
    averageSplitData = averageSeperateData(sleepAddedCleanData);
    splitData = seperateData(sleepAddedCleanData);
    mlAlgorithm.algorithm(splitData, averageSplitData);
}

// Removes Duplicate data
const getCleanData = (rawData) => {
    cleanData = {};
    Object.keys(rawData).forEach((e, index) => {
        cleanData[e] = eliminateDuplicateData(rawData[e]);
    })
    return cleanData;
}

const eliminateDuplicateData = (checkData) => {
    let newArray = []; 
    let uniqueObject = {}; 
        
    for (let i in checkData) { 
        objTitle = checkData[i]['date']; 
        uniqueObject[objTitle] = checkData[i]; 
    } 
    for (i in uniqueObject) { 
        newArray.push(uniqueObject[i]); 
    }
    return newArray;
}

const lightActivityFilteredData = (data) => {
    let lightSensorData = {};
    let activitiesData = {};
    let activitiesOverallData = [];
    
    let lightNormalValue = {
        '23.5-24': 0,
        '23-23.5': 0,
        '22.5-23': 0,
        '22-22.5': 0,
        '21.5-22': 0,
        '21-21.5': 0,
        '20.5-21': 0,
        '20-20.5': 0,
        '19.5-20': 0,
        '19-19.5': 0,
        '18.5-19': 0,
        '18-18.5': 0,
        '17.5-18': 0,
        '17-17.5': 0,
        '16.5-17': 0,
        '16-16.5': 0,
        '15.5-16': 0,
        '15-15.5': 0,
        '14.5-15': 0,
        '14-14.5': 0,
        '13.5-14': 0,
        '13-13.5': 0,
        '12.5-13': 0,
        '12-12.5': 0,
        '11.5-12': 0,
        '11-11.5': 0,
        '10.5-11': 0,
        '10-10.5': 0,
        '9.5-10': 0,
        '9-9.5': 0,
        '8.5-9': 0,
        '8-8.5': 0,
        '7.5-8': 0,
        '7-7.5': 0,
        '6.5-7': 0,
        '6-6.5': 0,
        '5.5-6': 0,
        '5-5.5': 0,
        '4.5-5': 0,
        '4-4.5': 0,
        '3.5-4': 0,
        '3-3.5': 0,
        '2.5-3': 0,
        '2-2.5': 0,
        '1.5-2': 0,
        '1-1.5': 0,
        '0.5-1': 0,
        '0-0.5': 0
    }
    let activityValue = {
        '23-24': 0,
        '22-23': 0,
        '21-22': 0,
        '20-21': 0,
        '19-20': 0,
        '18-19': 0,
        '17-18': 0,
        '16-17': 0,
        '15-16': 0,
        '14-15': 0,
        '13-14': 0,
        '12-13': 0,
        '11-12': 0,
        '10-11': 0,
        '9-10': 0,
        '8-9': 0,
        '7-8': 0,
        '6-7': 0,
        '5-6': 0,
        '4-5': 0,
        '3-4': 0,
        '2-3': 0,
        '1-2': 0,
        '0-1': 0
    }
    let duplicateLightNormalValue = { ...lightNormalValue };
    let duplicateActivityValue = { ...activityValue };
    let tryLightSensor = { ...activityValue }
    let averageLightSensorValue = { ...activityValue };
    
    Object.keys(data).forEach((e, index) => {
        if(e == 'lightSensor') {
            lightSensorData = data[e];
        } else if(e == 'activities') {
            activitiesData = data[e];
        }
    })
    let lengthLightSensorData = Object.keys(lightSensorData).length;
    
    // adding missing values in lightNormalValue
    for(let i=0; i<lengthLightSensorData; i++) {
        Object.entries(lightSensorData[i].stats).forEach((e, index) => {
            if(e[0] in lightNormalValue) {
                lightNormalValue[e[0]] = e[1]
            }
        });
        lightSensorData[i].stats = lightNormalValue;
        lightNormalValue = { ...duplicateLightNormalValue };
    }

    // Light sensor value making one hour from half hours
    let j = 0;
    let tempLightValue = 0;
    let dataIndex = 0;
    for(let i=0; i<lengthLightSensorData; i++) {
        Object.entries(lightSensorData[i].stats).forEach((e, index) => {
            tempLightValue += e[1];
            j++;
            if(j == 2) {
                tempLightValue = tempLightValue / 2;
                Object.keys(tryLightSensor).forEach((el, index2) => {
                    if(index2 == dataIndex) {
                        tryLightSensor[el] =  Math.trunc(tempLightValue);
                        averageLightSensorValue[el] += Math.trunc(tempLightValue);
                    }
                }) 
                j=0;
                tempLightValue = 0;
                dataIndex++;
            }
        });
        dataIndex = 0;
        lightSensorData[i].stats = tryLightSensor;
        tryLightSensor = { ...duplicateActivityValue };
    }

    // average light sensor value
    Object.keys(averageLightSensorValue).forEach((el, index2) => {
        averageLightSensorValue[el] = Math.trunc(averageLightSensorValue[el] / lengthLightSensorData);
    })
    
    // activity mapping with 0 and 1 and also calculating overall value
    let temp = 0;
    let tempDict;
    let lengthActivitiesData = Object.keys(activitiesData).length;
    for(let i=0; i<lengthActivitiesData; i++) {
        let overallValue = 0;
        Object.entries(activitiesData[i].stats).forEach((e, index) => {
            Object.entries(e[1]).forEach((ele, index2) => {
                if(ele[0] != 'STILL' && ele[0] != 'UNKNOWN') {
                    temp = 1;
                }
            });
            if(temp == 1) {
                activityValue[e[0]] = 1;
                overallValue += 1;
            }
            temp = 0;
        }); 
        tempDict = {};
        tempDict.date = activitiesData[i].date;
        tempDict.value = Math.floor((overallValue / 24) * 1000) / 1000;;
        activitiesOverallData.push(tempDict);
        
        activitiesData[i].stats = activityValue;
        activityValue = { ...duplicateActivityValue };
    }
    data.lightSensor = lightSensorData;
    data.activities = activitiesData;
    data.activitiesOverallData = activitiesOverallData;
    
    return data;
}

const usageFilteredData = (alldata) => {
    let data = alldata.usageStats;
    let usageStatsData = [];
    let stats = {
        socialMedia: ['facebook', 'twitter', 'youtube', 'instagram', 'whatsapp', 'snapchat', 'telegram', 'linkedin'],
        videoPlayer: ['player', 'vlc'],
        browser: ['firefox', 'chrome', 'opera', 'browser'],
        games: ['pubg', 'bombsquad', 'pokemon', 'ludo', 'gta','call of duty', 'candy crush', 'clash of clans', 'clash royale', 'subway surfers', 'free fire', 'temple run']
    }
    let statsValue = [
        socialMedia = 0,
        videoPlayer = 0,
        browser = 0,
        games = 0,
        others = 0
    ]
    let duplicateStatsValue = [ ...statsValue ];
    let temp;

    Object.keys(data).forEach((e, index) => {
        Object.entries(data[e].stats).forEach((e1, index1) => {
            let j = 0;
            let appToCheck = e1[0];
            
            Object.keys(stats).forEach((e2, index2) => {
                for(let i=0; i<stats[e2].length; i++) {
                    let re = new RegExp(stats[e2][i], 'i');
                    let flagRe = re.test(appToCheck);
                    if(flagRe) {
                        j = 1;
                        statsValue[index2] += e1[1];
                    }
                }
            })
            if(j == 0) {
                statsValue[4] += e1[1];
            }
        })
        
        let usageValue = 0;
        for(let i=0; i<statsValue.length; i++) {
            if(i == 0) {
                statsValue[i] = statsValue[i] * 0.8;
            } else if(i == 1) {
                statsValue[i] = statsValue[i] * 0.3;
            } else if(i == 2) {
                statsValue[i] = statsValue[i] * 0.4;
            } else if(i == 3){
                statsValue[i] = statsValue[i] * 0.6;
            } else if(i == 4){
                statsValue[i] = statsValue[i] * 0.5;
            }
            usageValue += statsValue[i];
        }
        temp = {}
        temp.date = data[e].date;
        temp.usage = Math.trunc(usageValue);
        usageStatsData.push(temp);
        statsValue = [ ...duplicateStatsValue ]
    })
    alldata.usageStats = usageStatsData;
    return alldata;
}

const notificationFilteredData = (alldata) => {
    let data = alldata.notifications;
    let notificationsData = [];
    let notificationValue = [];
    let stats = {
        socialMedia: ['facebook', 'twitter', 'youtube', 'instagram', 'whatsapp', 'snapchat', 'telegram', 'linkedin'],
        videoPlayer: ['player', 'vlc', 'hotstar'],
        browser: ['firefox', 'chrome', 'opera', 'browser'],
        games: ['pubg', 'bombsquad', 'pokemon', 'ludo', 'gta','call of duty', 'candy crush', 'clash of clans', 'clash royale', 'subway surfers', 'free fire', 'temple run']
    }
    let statsValue = [
        socialMedia = 0,
        videoPlayer = 0,
        browser = 0,
        games = 0,
        others = 0
    ]
    let duplicateStatsValue = [
        socialMedia = 0,
        videoPlayer = 0,
        browser = 0,
        games = 0,
        others = 0
    ]
    let temp;

    // average of notification clicked count
    let averageClickedCount = 0;
    let clickedCounter = 0
    Object.keys(data).forEach((e, index) => {
        if(data[e].clickedCount) {
            clickedCounter++;
            averageClickedCount += data[e].clickedCount;
        } else if(data[e].clickedCount == 0) {
            averageClickedCount += data[e].clickedCount;
        }
    })
    averageClickedCount = Math.trunc(averageClickedCount / clickedCounter);
    if(isNaN(averageClickedCount)) {
        averageClickedCount = 0;
    }

    // average clicked notification overall value
    let averageClickedNotificationValue = 0;
    let counterCheck = 0;
    Object.keys(data).forEach((e, index) => {
        if(data[e].clicked) {
            counterCheck++;
            Object.entries(data[e].clicked).forEach((e1, index1) => {
                let j = 0;
                let appToCheck = e1[0];
            
                Object.keys(stats).forEach((e2, index2) => {
                    for(let i=0; i<stats[e2].length; i++) {
                        let re = new RegExp(stats[e2][i], 'i');
                        let flagRe = re.test(appToCheck);
                        if(flagRe) {
                            j = 1;
                            statsValue[index2] += e1[1];
                        }
                    }
                })
                if(j == 0) {
                    statsValue[4] += e1[1];
                }
            })
            let individualUsageValue = 0;
            for(let i=0; i<statsValue.length; i++) {
                if(i == 0) {
                    statsValue[i] = statsValue[i] * 0.8;
                } else if(i == 1) {
                    statsValue[i] = statsValue[i] * 0.3;
                } else if(i == 2) {
                    statsValue[i] = statsValue[i] * 0.4;
                } else if(i == 3){
                    statsValue[i] = statsValue[i] * 0.6;
                } else if(i == 4){
                    statsValue[i] = statsValue[i] * 0.5;
                }
                individualUsageValue += statsValue[i];
            }
            data[e].clicked = Math.trunc(individualUsageValue);
            averageClickedNotificationValue += Math.trunc(individualUsageValue);
        }
        statsValue = [ ...duplicateStatsValue ]
    })
    averageClickedNotificationValue = Math.trunc(averageClickedNotificationValue / counterCheck);
    if(isNaN(averageClickedNotificationValue)) {
        averageClickedNotificationValue = 0;
    }

    // new filtered notifications data
    Object.keys(data).forEach((e, index) => {
        Object.entries(data[e].apps).forEach((e1, index1) => {
            let j = 0;
            let appToCheck = e1[0];
        
            Object.keys(stats).forEach((e2, index2) => {
                for(let i=0; i<stats[e2].length; i++) {
                    let re = new RegExp(stats[e2][i], 'i');
                    let flagRe = re.test(appToCheck);
                    if(flagRe) {
                        j = 1;
                        statsValue[index2] += e1[1];
                    }
                }
            })
            if(j == 0) {
                statsValue[4] += e1[1];
            }
        })
        let usageValue = 0;
        for(let i=0; i<statsValue.length; i++) {
            if(i == 0) {
                statsValue[i] = statsValue[i] * 0.8;
            } else if(i == 1) {
                statsValue[i] = statsValue[i] * 0.3;
            } else if(i == 2) {
                statsValue[i] = statsValue[i] * 0.4;
            } else if(i == 3){
                statsValue[i] = statsValue[i] * 0.6;
            } else if(i == 4){
                statsValue[i] = statsValue[i] * 0.5;
            }
            usageValue += statsValue[i];
        }
        temp = {}
        temp2 = {}
        temp.count = data[e].count;
        if(data[e].clickedCount) {
            temp.clickedCount = data[e].clickedCount;
        } else {
            temp.clickedCount = averageClickedCount;
        }
        temp.apps = Math.trunc(usageValue);
        if(data[e].clicked) {
            temp.clicked = data[e].clicked;
        } else {
            temp.clicked = averageClickedNotificationValue;
        }
        temp2.date = data[e].date;
        temp2.stats = temp;
        notificationsData.push(temp2);
        statsValue = [ ...duplicateStatsValue ]
    })
    
    Object.keys(notificationsData).forEach((e, index) => {
        let overallValue = 0;
        temp = {};
        Object.entries(notificationsData[e].stats).forEach((e1, index1) => {
            if(e1[0] == 'count') {
                e1[1] = e1[1] * 0.2;
                overallValue += e1[1];
            } else if(e1[0] == 'apps') {
                e1[1] = e1[1] * 0.2;
                overallValue += e1[1];
            } else if(e1[0] == 'clicked') {
                e1[1] = e1[1] * 0.6;
                overallValue += e1[1];
            } else if(e1[0] == 'clickedCount') {
                e1[1] = e1[1] * 0.8;
                overallValue += e1[1];
            }
        })
        temp.date = notificationsData[e].date;
        temp.value = Math.trunc(overallValue);
        notificationValue.push(temp);
    })

    alldata.notifications = notificationValue;
    return alldata;
}

const callLogsDataValue = (alldata) => {
    let data = alldata.callStats;
    let temp;
    let callStatsData = [];

    Object.keys(data).forEach((e, index) => {
        let uniqueCallCount = 0;
        let totalDuration = 0;
        let missedCallCount = 0;
        let overallValue = 0;
        Object.entries(data[e].stats).forEach((e1, index1) => {
            if(e1[0] == 'uniqueIncoming' || e1[0] == 'uniqueOutgoing' || e1[0] == 'uniqueMissed') {
                uniqueCallCount += e1[1];
            } else if(e1[0] == 'incomingDuration' || e1[0] == 'outgoingDuration') {
                totalDuration += e1[1];
            } else if(e1[0] == 'missed') {
                missedCallCount += e1[1];
            }
        })
        uniqueCallCount = uniqueCallCount * 0.4;
        totalDuration = totalDuration * 0.8;
        missedCallCount = missedCallCount * 0.6;
        overallValue = uniqueCallCount + totalDuration + missedCallCount;

        temp = {}
        temp.date = data[e].date;
        temp.value = Math.trunc(overallValue);
        callStatsData.push(temp);
    })
    alldata.callStats = callStatsData;
    return alldata;
}

const averageSeperateData = (data) => {
    let seperatedData = {};
    Object.keys(data).forEach((e, index) => {
        if(e != 'activities' && e != 'lightSensor') {
            seperatedData[e] = averageRemainingData(data[e]);
        }
    }) 
    return seperatedData;
}

const seperateData = (data) => {
    seperatedData = {};
    Object.keys(data).forEach((e, index) => {
        seperatedData[e] = remainingData(data[e]);
    })
    return seperatedData;
}

const averageRemainingData = (data) => {
    let averageValue = [0, 0];
    let arrayLength = Object.keys(data).length;
    for(let i=0; i<arrayLength - 7; i++) {
        averageValue[0] += data[i].value;
    }
    
    for(let i = arrayLength - 7; i < arrayLength; i++) {
        averageValue[1] += data[i].value;
    } 
    averageValue[0] = Math.floor((averageValue[0] / (arrayLength - 7)) * 1000) / 1000;
    averageValue[1] = Math.floor((averageValue[1] / 7) * 1000) / 1000;
    return averageValue;
}

const remainingData = (data) => {
    let remainData = [];
    let recentData = [];
    let arrayLength = Object.keys(data).length;
    for(let i=0; i<arrayLength-7; i++) {
        remainData.push(data[i]);
    } 
    for(let i=arrayLength-7; i<arrayLength; i++) {
        recentData.push(data[i]);
    }
    sep = {remainData, recentData};
    return sep;
}

const solveMissingDateValue = (data) => {
    // solving missing dates problem
    const oneDay = 86400000;
    const startTimeStamp = moment(data.unlocks[0].date, 'DD/MM/YY').valueOf();
    const endTimeStamp = moment(data.unlocks[Object.keys(data.unlocks).length - 1].date, 'DD/MM/YY').valueOf();
    
    let transformedData = {};

    let transformedUnlockData = [];
    let transformedScreenOnTimeData = [];
    let transformedNotificationsData = [];
    let transformedActivitiesData = [];
    let transformedOverallActivitiesData = [];
    let transformedCallStatsData = [];
    let transformedUsageStatsData = [];
    let transformedLightSensorData = [];
    let transformedStepCounterData = [];

    let curr = startTimeStamp;
    let temp;
    let date;

    let averageUnlocksData = unlocksAverageData(data.unlocks);
    let averageScreenOnTimeData = screenOnTimeAverageData(data.screenOnTime);
    let averageNotificationsData = notificationAverageData(data.notifications);
    let averageActivitiesData = activitiesAverageData(data.activities);
    let averageOverallActivitiesData = overallActivitiesAverageData(data.activitiesOverallData);
    let averageCallStatsData = callStatsAverageData(data.callStats);
    let averageUsageStatsData = usageStatsAverageData(data.usageStats);
    let averageLightSensorData = lightSensorAverageData(data.lightSensor);
    let averageStepCounterData = stepCounterAverageData(data.stepCounter);

    while(curr <= endTimeStamp) {
        date = moment(curr).format('DD/MM/YY');
        let tempDataUnlocks = data.unlocks.find(el => el.date === date);
        let tempDataScreenOnTime = data.screenOnTime.find(el => el.date === date);
        let tempDataNotifications = data.notifications.find(el => el.date === date);
        let tempDataActivities = data.activities.find(el => el.date === date);
        let tempDataOverallActivities = data.activitiesOverallData.find(el => el.date === date);
        let tempDataCallStats = data.callStats.find(el => el.date === date);
        let tempDataUsageStats = data.usageStats.find(el => el.date === date);
        let tempDataLightSensor = data.lightSensor.find(el => el.date === date);
        let tempDataStepCounter = data.stepCounter.find(el => el.date === date);

        // Unlocks
        if(tempDataUnlocks) {
            temp = {};
            temp.date = date;
            temp.value = tempDataUnlocks.count;
            transformedUnlockData.push(temp);
        } else {
            temp = {};
            temp.date = date;
            temp.value = averageUnlocksData;
            transformedUnlockData.push(temp);
        }
        
        // Screen On Time
        if(tempDataScreenOnTime) {
            temp = {};
            temp.date = date;
            temp.value = tempDataScreenOnTime.time / 60000;
            transformedScreenOnTimeData.push(temp);
        } else {
            temp = {};
            temp.date = date;
            temp.value = averageScreenOnTimeData / 60000;
            transformedScreenOnTimeData.push(temp);
        }

        // Notifications
        if(tempDataNotifications) {
            temp = {};
            temp.date = date;
            temp.value = tempDataNotifications.value;
            transformedNotificationsData.push(temp);
        } else {
            temp = {};
            temp.date = date;
            temp.value = averageNotificationsData;
            transformedNotificationsData.push(temp);
        }

        // Activities
        if(tempDataActivities) {
            temp = {};
            temp.date = date;
            temp.stats = tempDataActivities.stats;
            transformedActivitiesData.push(temp);
        } else {
            temp = {};
            temp.date = date;
            temp.stats = averageActivitiesData;
            transformedActivitiesData.push(temp);
        }

        // Overall Activities
        if(tempDataOverallActivities) {
            temp = {};
            temp.date = date;
            temp.value = tempDataOverallActivities.value;
            transformedOverallActivitiesData.push(temp);
        } else {
            temp = {};
            temp.date = date;
            temp.value = averageOverallActivitiesData;
            transformedOverallActivitiesData.push(temp);
        }

        // Call Stats
        if(tempDataCallStats) {
            temp = {};
            temp.date = date;
            temp.value = tempDataCallStats.value;
            transformedCallStatsData.push(temp);
        } else {
            temp = {};
            temp.date = date;
            temp.value = averageCallStatsData;
            transformedCallStatsData.push(temp);
        }

        // App Usage
        if(tempDataUsageStats) {
            temp = {};
            temp.date = date;
            temp.value = tempDataUsageStats.usage;
            transformedUsageStatsData.push(temp);
        } else {
            temp = {};
            temp.date = date;
            temp.value = averageUsageStatsData;
            transformedUsageStatsData.push(temp);
        }

        // Light Sensor
        if(tempDataLightSensor) {
            temp = {};
            temp.date = date;
            temp.stats = tempDataLightSensor.stats;
            transformedLightSensorData.push(temp);
        } else {
            temp = {};
            temp.date = date;
            temp.stats = averageLightSensorData;
            transformedLightSensorData.push(temp);
        }

        // Step Counter
        if(tempDataStepCounter) {
            temp = {};
            temp.date = date;
            temp.value = tempDataStepCounter.steps;
            transformedStepCounterData.push(temp);
        } else {
            temp = {};
            temp.date = date;
            temp.value = averageStepCounterData;
            transformedStepCounterData.push(temp);
        }
        curr += oneDay;
    }
    transformedData.unlocks = transformedUnlockData;
    transformedData.screenOnTime = transformedScreenOnTimeData;
    transformedData.notifications = transformedNotificationsData;
    transformedData.activities = transformedActivitiesData;
    transformedData.activitiesOverallData = transformedOverallActivitiesData;
    transformedData.callStats = transformedCallStatsData;
    transformedData.usageStats = transformedUsageStatsData;
    transformedData.lightSensor = transformedLightSensorData;
    transformedData.stepCounter = transformedStepCounterData;
    return transformedData;
}

const unlocksAverageData = (data) => {
    let unlockCounter = 0;
    Object.keys(data).forEach((e, index) => {
        unlockCounter += data[e].count;
    })
    unlockCounter = unlockCounter / Object.keys(data).length;
    return Math.trunc(unlockCounter);
}

const screenOnTimeAverageData = (data) => {
    let screenTime = 0;
    Object.keys(data).forEach((e, index) => {
        screenTime += data[e].time;
    })
    screenTime = screenTime / Object.keys(data).length;
    return Math.trunc(screenTime);
}

const notificationAverageData = (data) => {
    let averageNotificationValue = 0;
    Object.keys(data).forEach((e, index) => {
        averageNotificationValue += data[e].value;
    })
    averageNotificationValue = averageNotificationValue / Object.keys(data).length;
    return Math.trunc(averageNotificationValue);
}

const activitiesAverageData = (data) => {
    averageActivityValue = {
        '23-24': 0,
        '22-23': 0,
        '21-22': 0,
        '20-21': 0,
        '19-20': 0,
        '18-19': 0,
        '17-18': 0,
        '16-17': 0,
        '15-16': 0,
        '14-15': 0,
        '13-14': 0,
        '12-13': 0,
        '11-12': 0,
        '10-11': 0,
        '9-10': 0,
        '8-9': 0,
        '7-8': 0,
        '6-7': 0,
        '5-6': 0,
        '4-5': 0,
        '3-4': 0,
        '2-3': 0,
        '1-2': 0,
        '0-1': 0
    }

    Object.keys(data).forEach((e, index) => {
        Object.entries(data[e].stats).forEach((e1, index) => {
            if(e1[0] in averageActivityValue) {
                averageActivityValue[e1[0]] += e1[1];
            }
        })
    })
    Object.keys(averageActivityValue).forEach((e, index) => {
        let tempAverageData = 29 - averageActivityValue[e];
        if(tempAverageData >= averageActivityValue[e]) {
            averageActivityValue[e] = 0;
        } else {
            averageActivityValue[e] = 1;
        }
    })

    return averageActivityValue;
}

const overallActivitiesAverageData = (data) => {
    let averageActivityValue = 0;
    Object.keys(data).forEach((e, index) => {
        averageActivityValue += data[e].value;
    })
    averageActivityValue = averageActivityValue / Object.keys(data).length;
    return Math.floor(averageActivityValue * 1000) / 1000;
}

const callStatsAverageData = (data) => {
    let avgCallStatsValue = 0;
    Object.keys(data).forEach((e, index) => {
        avgCallStatsValue += data[e].value;
    })
    return Math.trunc(avgCallStatsValue / Object.keys(data).length);
}

const usageStatsAverageData = (data) => {
    let averageUsage = 0;
    Object.keys(data).forEach((e, index) => {
        averageUsage += data[e].usage;
    })
    return Math.trunc(averageUsage / Object.keys(data).length);
}

const lightSensorAverageData = (data) => {
    averageLightSensorValue = {
        '23-24': 0,
        '22-23': 0,
        '21-22': 0,
        '20-21': 0,
        '19-20': 0,
        '18-19': 0,
        '17-18': 0,
        '16-17': 0,
        '15-16': 0,
        '14-15': 0,
        '13-14': 0,
        '12-13': 0,
        '11-12': 0,
        '10-11': 0,
        '9-10': 0,
        '8-9': 0,
        '7-8': 0,
        '6-7': 0,
        '5-6': 0,
        '4-5': 0,
        '3-4': 0,
        '2-3': 0,
        '1-2': 0,
        '0-1': 0
    }

    Object.keys(data).forEach((e, index) => {
        Object.entries(data[e].stats).forEach((e1, index) => {
            if(e1[0] in averageLightSensorValue) {
                averageLightSensorValue[e1[0]] += e1[1];
            }
        })
    })
    Object.keys(averageLightSensorValue).forEach((el, index2) => {
        averageLightSensorValue[el] = Math.trunc(averageLightSensorValue[el] / Object.keys(data).length);
    })
    
    return averageLightSensorValue;
}

const stepCounterAverageData = (data) => {
    let stepCounterValue = 0;
    Object.keys(data).forEach((e, index) => {
        stepCounterValue += data[e].steps;
    })
    stepCounterValue = stepCounterValue / Object.keys(data).length;
    return Math.trunc(stepCounterValue);
}

const sleepDataValue = (data) => {
    let activitiesData = data.activities;
    let lightSensorData = data.lightSensor;

    activityValue = {
        '23-24': 0,
        '22-23': 0,
        '21-22': 0,
        '20-21': 0,
        '19-20': 0,
        '18-19': 0,
        '17-18': 0,
        '16-17': 0,
        '15-16': 0,
        '14-15': 0,
        '13-14': 0,
        '12-13': 0,
        '11-12': 0,
        '10-11': 0,
        '9-10': 0,
        '8-9': 0,
        '7-8': 0,
        '6-7': 0,
        '5-6': 0,
        '4-5': 0,
        '3-4': 0,
        '2-3': 0,
        '1-2': 0,
        '0-1': 0
    }

    duplicateActivityValue = {...activityValue};

    let sleepAddedData = [];
    let temp;

    for(let i=0; i<Object.keys(activitiesData).length; i++) {
        let sleepHours = 0;
        Object.entries(activitiesData[i].stats).forEach((e, index) => {
            activityValue[e[0]] = e[1];
        })

        Object.entries(lightSensorData[i].stats).forEach((e1, index1) => {
            if(activityValue[e1[0]] == 0 && e1[1] == 0) {
                sleepHours += 1;
            }
        })
        
        temp = {};
        temp.date = activitiesData[i].date;
        temp.value = sleepHours;
        sleepAddedData.push(temp);
        activityValue = { ...duplicateActivityValue };
    }
    data.sleepHours = sleepAddedData;
    return data;
}

module.exports = {
    rawData
}
