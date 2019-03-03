const dockerOpModuleName = "dockerop";

import Daemon from "./daemon";
import { setInterval } from "timers"; 

interface DockerExecResponce<T> {
    cid?: T;
    cids?: T;
    error?: any;
}

export interface PortMapItem {
    docker: number;
    host: number;
}

export interface DirMapItem {
    docker: string;
    host: string;
    readonly?: boolean;
}

export default class Docker {
    _daemon: Daemon;
    _runningCids: string[] = [];

    constructor(daemon: Daemon) {
        this._daemon = daemon;
    }

    private execWrapper<T>(command: string, args: object, resolve: (arg: T) => void, reject: (arg: T) => void): void {
        this._daemon.call(dockerOpModuleName, command, args, rv => {
            var res = <DockerExecResponce<T>>rv;

            if (res.cid) resolve(res.cid);
            else reject(res.error);
        });
    }

    async create(imageName: string, portMap: PortMapItem[], dirMap: DirMapItem[], extraArgs: string | string[]): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.execWrapper<string>(
                "create",
                {
                    "img" : imageName,
                    "portmap" : portMap,
                    "dirmap" : dirMap,
                    "extra" : (typeof extraArgs == "string" ? extraArgs : extraArgs.join(" "))
                },
                resolve,
                reject
            );
        });
    }

    async start(containerId: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.execWrapper<string>(
                "start",
                {
                    "cid" : containerId
                },
                resolve,
                reject
            );
        });
    }
    
    async kill(containerId: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.execWrapper<string>(
                "kill",
                {
                    "cid" : containerId
                },
                resolve,
                reject
            );
        });
    }

    /*
    // delete a container exists
    // "docker rm"
    ex.rm = async function(containerId) {
        return new Promise(resolve => execWrapper(`docker rm ${containerId}`, resolve));
    }
    */

    async ps() {
        return new Promise<string[]>((resolve, reject) => {
            this.execWrapper<string[]>("ps", {}, resolve, reject);
        });
    }

    async psall() {
        return new Promise<string[]>((resolve, reject) => {
            this.execWrapper<string[]>("psall", {}, resolve, reject);
        });
    }

    async killmany(cids: string[]) {
        return new Promise<string[]>((resolve, reject) => {
            this._daemon.call(dockerOpModuleName, "killmany", { cids : cids }, rv => {
                var res = <DockerExecResponce<string[]>>rv;
                if (res.error) {
                    reject(res.error);
                } else {
                    resolve(res.cids);
                }
            });
        });
    }

    async refreshRunningStatus(): Promise<string[]> {
        return this._runningCids = (await this.ps()) || [];
    }

    isCidRunning(cid: string) {
        return this._runningCids.includes(cid);
    }

    _refresher: NodeJS.Timeout | undefined = undefined;

    startRefresher() {
        this.refreshRunningStatus(); // do it once
        var _this = this;
        this._refresher = setInterval(function() { _this.refreshRunningStatus(); }, 5000);
    }

    closeRefresher() {
        if (this._refresher) clearInterval(this._refresher);
    }
}
