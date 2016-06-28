export declare class SimpleMSSQL {
	constructor(sqlConfig:any);
	query(sqlString: string, params: any, done:(err: any, recordsets: any) => void) : void;
	execute(storedProc: string, params: any, done:(err: any, recordsets: any) => void) : void;
}