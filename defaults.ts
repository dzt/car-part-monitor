import { MonitorDefaults } from './types';

const defaultValues : MonitorDefaults = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    },
    location_options: [
        { id: 'boston', title: 'Boston (CT,MA,ME,NH,RI,VT)' },
        { id: 'chicago', title: 'Chicago (IL,IN,WI)' },
        { id: 'cincinnati', title: 'Cincinnati (IN,KY,OH)' },
        { id: 'kansascity', title: 'Kansas City (KS,MO)' },
        { id: 'lasvegas', title: 'Las Vegas (AZ,CA,NV,UT)' },
        { id: 'memphis', title: 'Memphis (AR,MS,TN)' },
        { id: 'minneapolisstpaul', title: 'Minneapolis/St.Paul (MN,WI)' },
        { id: 'newyorkcity', title: 'New York City (CT,NJ,NY)' },
        { id: 'philadelphia', title: 'Philadelphia (DE,MD,NJ,PA)' },
        { id: 'pittsburgh', title: 'Pittsburgh (OH,PA,WV)' },
        { id: 'portland', title: 'Portland (OR,WA)' },
        { id: 'stlouis', title: 'St. Louis (IL,MO)' },
        { id: 'toledo', title: 'Toledo (OH,MI)' },
        { id: 'washingtondc', title: 'Washington DC(DC,MD,VA,WV)' }
    ],
    parts: [
        'Transmission',
        'Hood',
        'Engine',
        'Fuel Tank' 
    ]
}

export default defaultValues;