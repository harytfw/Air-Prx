export interface SchemeItem {
    name: string,
    type: string,
    fields?: SchemeItem[],
    data?: any,
    default?: any,
};
export const rootScheme: SchemeItem = {
    name: '_root_',
    type: 'object',
    fields: [
        {
            name: 'groups',
            type: 'array_object',
            fields: [
                {
                    name: 'subType',
                    type: 'options',
                    data: ['embeded-gfw'],
                    default: ""
                }, {
                    name: 'subSource',
                    type: 'string',
                }, {
                    name: 'proxyInfo',
                    type: 'object',
                    fields: [
                        {
                            name: 'type',
                            type: 'options',
                            data: ['http', 'https', 'socks'],
                            default: 'http'
                        },
                        {
                            name: 'host',
                            type: 'string',
                            default: ''
                        },
                        {
                            name: 'port',
                            type: 'number',
                            default: 80
                        },
                        {
                            name: 'username',
                            type: 'string',
                            default: ''
                        },
                        {
                            name: 'password',
                            type: 'string',
                            default: ''
                        },
                        {
                            name: 'proxyDNS',
                            type: 'boolean',
                            default: false
                        },
                    ]
                },
                {
                    name: 'internalRules',
                    type: 'array_string',
                }]
        },
        {
            name: 'test-field',
            type: 'string',
            default: '',
        }

    ]
}