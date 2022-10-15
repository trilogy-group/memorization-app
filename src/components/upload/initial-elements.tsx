export const nodes = [
    {
        id: 'S1',
        type: 'graphNode',
        data: {
            label: 'S1',
            kind: 'Standard',
            name: 'I am Standard 1',
            desc: 'I am Description 1'
        },
        position: {
            x: 0,
            y: 0
        }
    },
    {
        id: 'S2',
        type: 'graphNode',
        data: {
            label: 'S2',
            kind: 'Standard',
            name: 'I am Standard 2',
            desc: 'I am Description 2'
        },
        position: {
            x: 1,
            y: 0
        }
    }
];

export const edges = [
    {
        id: 'E1',
        source: 'S1',
        target: 'S2',
        label: 'depends_on'
    }
];