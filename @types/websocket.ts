/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'irc-framework/src/transports/websocket' {
    import { EventEmitter } from 'eventemitter3';

    export default class Connection extends EventEmitter {
        socket: any;

        connected: boolean;

        last_socket_error: any;

        encoding: string;

        incoming_buffer: string;

        constructor(options: any);

        isConnected(): boolean;

        writeLine(line: string, cb: (e: any) => any): void;

        debugOut(out: any): void;

        connect(): void;

        close(): void;

        setEncoding(encoding: any): void;
    }

}