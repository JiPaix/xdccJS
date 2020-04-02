import * as IRC from 'irc-framework';
declare type packageNumber = string | number;
export default class XDCC extends IRC.Client {
    nick: string;
    chan: string;
    path: string;
    verbose: boolean;
    disconnect: boolean;
    on(eventType: string | symbol, cb: (event: any) => void): this;
    constructor(parameters: {
        host: string;
        port: number;
        nick: string;
        chan: string;
        path: string;
        disconnect?: boolean;
        verbose?: boolean;
    });
    private live;
    send(target: string, packet: packageNumber): void;
    private nickRandomizer;
    private formatBytes;
    private HashTag;
    private uint32ToIP;
    private parseCtcp;
}
export { };


