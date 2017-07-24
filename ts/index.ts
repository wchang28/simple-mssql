import * as sql from 'mssql';
import * as events from 'events';
import * as _ from 'lodash';
import {get as getConnectRetry, IConnectRetry} from "connect-retry";

export interface Options {
    reconnectIntervalMS?: number
}

export type State = "not-connected" | "connecting" | "connected" | "disconnecting";

export interface ISimpleMSSQL {
    readonly Options: Options;
    readonly Connection: sql.ConnectionPool;
    readonly State: State;
    readonly msnodesqlv8: boolean;
    readonly Connected: boolean;
    readonly Connecting: boolean;

    connect(): void;
    disconnect(): Promise<void>;
    query(sqlString:string, params?: any) : Promise<sql.IResult<any>>;
    execute(storedProc:string, params?: any) : Promise<sql.IProcedureResult<any>>;

    on(event: "change", listener: (newSttate: State, oldState: State) => void) : this;
    on(event: "connecting", listener: (connection: sql.ConnectionPool) => void) : this;
    on(event: "connect", listener: (connection: sql.ConnectionPool) => void) : this;
    on(event: "error", listener: (err: any) => void) : this;
    on(event: "close", listener: () => void) : this;
}

export class SimpleMSSQL extends events.EventEmitter implements ISimpleMSSQL {
    private __state: State; 
    private __connection: sql.ConnectionPool;
    private __options: Options;
    private __connectRetry: IConnectRetry<sql.ConnectionPool>;
    private static defaultOptions: Options = {reconnectIntervalMS: 3000};
    private static NOT_CONNECTED_ERR  = {error: 'internal-server-error', error_description: 'not connected to the database'};
    constructor(private __sqlConfig: sql.config, options?: Options) {
        super();
        options = (options || SimpleMSSQL.defaultOptions)
        this.__options = _.assignIn({}, SimpleMSSQL.defaultOptions, options);
        this.__state = "not-connected";
        this.__connection = this.createPool(this.msnodesqlv8, this.__sqlConfig);
        this.__connection.on("error", (err: any) => {
            this.emit("error", err);
        });
        this.__connectRetry = getConnectRetry(this.__connection, this.__options.reconnectIntervalMS);
        this.__connectRetry.on("connecting", () => {
            this.setState("connecting");
            this.emit("connecting");
        }).on("connected", (pool: sql.ConnectionPool) => {
            this.setState("connected");
            this.emit("connect", pool);
        }).on("error", (err: any) => {
            this.emit("error", err);
        });
    }
    get msnodesqlv8(): boolean {return (!this.__sqlConfig.user || !this.__sqlConfig.password ? true : false);}
    get Options(): Options {return this.__options;}
    get Connection(): sql.ConnectionPool {return this.__connection;}
    get State(): State {return this.__state;}
    get Connected(): boolean {return this.State === "connected";}
    get Connecting(): boolean {return this.State === "connecting";}
    private setState(newState: State) {
        let oldState = this.__state;
        if (this.__state !== newState) {
            this.__state = newState;
            this.emit("change", newState, oldState);
        }
    }
    private closeConnection() : Promise<void> {
        return new Promise<void>((resolve: () => void, reject: (err: any) => void) => {
            this.setState("disconnecting");
            this.__connection.close()
            .then(() => {
                //console.log(":-) connection.close() success");
                this.__connection = null;
                this.setState("not-connected");
                this.emit("close");
                resolve();
            }).catch((err: any) => {
                //console.error("!!! connection.close() failed !!! err=" + err.toString());
                this.__connection = null;
                this.setState("not-connected");
                this.emit("close");
                reject(err);
            });
        });
    }
    private createPool(msnodesqlv8: boolean, config: sql.config) : sql.ConnectionPool {
        if (msnodesqlv8) {
            let nsql = require("mssql/msnodesqlv8");
            return new nsql.ConnectionPool(config);
        } else
            return new sql.ConnectionPool(config);
    }
    query(sqlString:string, params?: any) : Promise<sql.IResult<any>> {
        if (!this.Connected)
            return Promise.reject(SimpleMSSQL.NOT_CONNECTED_ERR);
        else {
            let request = this.Connection.request();
            if (params) {
                for (let field in params)
                    request.input(field, params[field]);
            }
            return request.query(sqlString);       
        }
    }
    execute(storedProc:string, params: any) : Promise<sql.IProcedureResult<any>> {
        if (!this.Connected)
            return Promise.reject(SimpleMSSQL.NOT_CONNECTED_ERR);
        else {
            let request = this.Connection.request();
            if (params) {
                for (let field in params)
                    request.input(field, params[field]);
            }
            return request.execute(storedProc);       
        }
    }
    connect() {
        if (this.State === "not-connected")
            this.__connectRetry.start();
    }
    disconnect() : Promise<void> {
        if (!this.Connected)
            return Promise.reject(SimpleMSSQL.NOT_CONNECTED_ERR);
        else
            return this.closeConnection();
    }
}

export * from 'mssql';

export function get(sqlConfig: sql.config, options?: Options) : ISimpleMSSQL {return new SimpleMSSQL(sqlConfig, options);}