/// <reference types="node" />
import * as sql from 'mssql';
import * as events from 'events';
export interface Options {
    reconnectIntervalMS?: number;
}
export declare type State = "not-connected" | "connecting" | "connected" | "disconnecting";
export interface ISimpleMSSQL {
    readonly Options: Options;
    readonly Connection: sql.ConnectionPool;
    readonly State: State;
    readonly msnodesqlv8: boolean;
    readonly Connected: boolean;
    readonly Connecting: boolean;
    connect(): void;
    disconnect(): Promise<void>;
    query(sqlString: string, params?: any): Promise<sql.IResult<any>>;
    execute(storedProc: string, params?: any): Promise<sql.IProcedureResult<any>>;
    on(event: "change", listener: (newSttate: State, oldState: State) => void): this;
    on(event: "connecting", listener: (connection: sql.ConnectionPool) => void): this;
    on(event: "connect", listener: (connection: sql.ConnectionPool) => void): this;
    on(event: "error", listener: (err: any) => void): this;
    on(event: "close", listener: () => void): this;
}
export declare class SimpleMSSQL extends events.EventEmitter implements ISimpleMSSQL {
    private __sqlConfig;
    private __state;
    private __connection;
    private __options;
    private __connectRetry;
    private static defaultOptions;
    private static NOT_CONNECTED_ERR;
    constructor(__sqlConfig: sql.config, options?: Options);
    readonly msnodesqlv8: boolean;
    readonly Options: Options;
    readonly Connection: sql.ConnectionPool;
    readonly State: State;
    readonly Connected: boolean;
    readonly Connecting: boolean;
    private setState(newState);
    private closeConnection();
    private createPool(msnodesqlv8, config);
    query(sqlString: string, params?: any): Promise<sql.IResult<any>>;
    execute(storedProc: string, params: any): Promise<sql.IProcedureResult<any>>;
    connect(): void;
    disconnect(): Promise<void>;
}
export * from 'mssql';
export declare function get(sqlConfig: sql.config, options?: Options): ISimpleMSSQL;
