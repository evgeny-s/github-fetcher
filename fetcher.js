import fetch from "node-fetch";
import fs from "fs";
import {exec} from "child_process";

const API_URL = 'https://api.github.com';
const BASE_DIR = './tmp';

export class Fetcher {
    accessToken = '';

    constructor() {
        this.accessToken = process.env.PERSONAL_ACCESS_TOKEN;

        if (!this.accessToken) {
            throw new Error('PERSONAL_ACCESS_TOKEN ENV param is required');
        }
    }

    async getUserOrgs() {
        try {
            const data = await fetch(`${API_URL}/user/orgs`, {headers: {"Authorization": `token ${this.accessToken}`}});

            return await data.json();
        } catch (e) {
            console.error(e);

            throw e;
        }
    }

    async getReposByOrg(org) {
        try {
            let page = 1;
            let result = [];
            while (true) {
                const data = await fetch(`${API_URL}/orgs/${org}/repos?per_page=25&page=${page}&visibility=all`, {headers: {"Authorization": `token ${this.accessToken}`}});
                const json = await data.json();

                if (!json.length) {
                    break;
                }

                result.push(...json.map(item => item.ssh_url));
                page++;
            }

            return result;
        } catch (e) {
            console.error(e);

            throw e;
        }
    }

    async cloneRepo(org, sshUrl) {
        return new Promise((res, rej) => {
            const dirPath = `${BASE_DIR}/${org}`;
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, {recursive: true});
            }

            exec(`cd ${dirPath} && git clone ${sshUrl}`, (error) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    rej(error.message);
                    return;
                }

                res();
            });
        });
    }

    async run() {
        const orgs = await this.getUserOrgs();

        if (!orgs.length) {
            throw new Error('Something went wrong. Organizations is not iterable. Details: ' + orgs.message);
        }

        for (const org of orgs) {
            const orgName = org.login;

            const repos = await this.getReposByOrg(orgName);

            for (let repo of repos) {
                await this.cloneRepo(orgName, repo);
                console.log(`Finished for ${repo}`);
            }
        }
    }
}
