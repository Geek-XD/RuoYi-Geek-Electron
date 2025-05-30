import BindMapping from "@main/annotation/BindMapping";
import Log from "@main/annotation/Log";
import type { IpcMainInvokeEvent } from "electron";

export default class IndexController {
    @BindMapping('ping', 'on')
    @Log
    async ping(_event: IpcMainInvokeEvent, data: any) {
        console.log('ping', data);
    }
}