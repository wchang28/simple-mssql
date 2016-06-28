export declare class SimpleMSSQL {
	query(sqlString: string, params: any, done:(err: any, recordsets: any) => void) : void;
	execute(storedProc: string, params: any, done:(err: any, recordsets: any) => void) : void;
}