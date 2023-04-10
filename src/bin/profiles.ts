import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import XDCC, { Params } from '..';
import { BaseCommander, savedParams } from './commander';
import BinError from './errorhandler';

export default class Profiles extends BaseCommander {
  profilePath: string;

  defaultProfilePath: string;

  availableProfiles: string[];

  defaultProfileName: string | undefined;

  defaultProfile: [Params, savedParams] | undefined;

  isProfileKeys: string[];

  constructor() {
    super();
    this.isProfileKeys = ['saveProfile', 'deleteProfile', 'setProfile', 'listProfile'];
    this.profilePath = path.join(os.homedir(), '.xdccJS', 'profiles/');
    this.defaultProfilePath = path.join(this.profilePath, '/default.json');
    this.availableProfiles = this.initFolder();
    this.defaultProfileName = JSON
      .parse(fs.readFileSync(this.defaultProfilePath).toString()).profile;
    if (this.defaultProfileName && !this.hasProfileAction()) {
      this.log(`%success% loaded default profile ${this.defaultProfileName}`);
      this.defaultProfile = this.loadDefaultProfile();
      this.mergeProfileWithARGV();
    }
  }

  private loadDefaultProfile(): [Params, savedParams] | undefined {
    if (!this.defaultProfileName) return undefined;
    const lookup = path.join(this.profilePath, `${this.defaultProfileName}.json`);
    if (!fs.existsSync(lookup)) return undefined;
    const string = fs.readFileSync(lookup).toString();
    return JSON.parse(string) as [Params, savedParams];
  }

  protected initFolder(): string[] {
    if (!fs.existsSync(this.profilePath)) {
      fs.mkdirSync(this.profilePath, { recursive: true });
    }
    if (!fs.existsSync(this.defaultProfilePath)) {
      fs.writeFileSync(this.defaultProfilePath, JSON.stringify({ profile: undefined }));
    }
    return fs.readdirSync(this.profilePath).filter((file) => file.endsWith('.json'));
  }

  private hasTooManyProfileAction():boolean {
    if (this.program.deleteProfile && this.program.listProfile) return true;
    if (this.program.deleteProfile && this.program.saveProfile) return true;
    if (this.program.deleteProfile && this.program.setProfile) return true;
    if (this.program.listProfile && this.program.saveProfile) return true;
    if (this.program.listProfile && this.program.setProfile) return true;
    if (this.program.saveProfile && this.program.setProfile) return true;
    return false;
  }

  protected profileAction(): boolean {
    if (this.hasTooManyProfileAction()) throw new BinError("Profile options aren't meant to be mixed, only use one of those.");
    if (this.program.deleteProfile) {
      this.deleteProfile(this.program.deleteProfile);
      return true;
    }
    if (this.program.listProfile) {
      this.listProfile();
      return true;
    }
    if (this.program.saveProfile) {
      this.saveProfile();
      return true;
    }
    if (this.program.setProfile) {
      this.setProfile(this.program.setProfile);
      return true;
    }
    return false;
  }

  private saveProfile(): void {
    const opts = this.xdccJSOPTS();
    if (!opts) {
      this.log('%danger% In order to save your profile a server must be provided, use: %grey%--server irc.server.net');
    } else {
      const xdccJS = new XDCC(opts);
      xdccJS.quit();
      const filePath = path.join(this.profilePath, `${this.program.saveProfile}.json`);
      fs.writeFileSync(filePath, JSON.stringify(this.xdccBINOPTS(true)));
      fs.writeFileSync(
        this.defaultProfilePath,
        JSON.stringify({ profile: this.program.saveProfile }),
      );
      this.availableProfiles = this.initFolder();
      this.log(`%info% ${this.program.saveProfile} set as new default profile`);
    }
  }

  private setProfile(profile: string): void {
    const search = `${profile}.json`;
    if (this.availableProfiles.includes(search)) {
      fs.writeFileSync(
        this.defaultProfilePath,
        JSON.stringify({ profile: this.program.setProfile }),
      );
      this.log(`%success% Set ${profile} as new default profile`);
    } else {
      this.log(`%danger% Profile ${profile} doesn't exist`);
    }
  }

  private deleteProfile(profile: string): void {
    const search = `${profile}.json`;
    if (this.availableProfiles.includes(search)) {
      fs.unlinkSync(path.join(this.profilePath, search));
      fs.unlinkSync(this.defaultProfilePath);
      this.log(`%info% Profile ${this.defaultProfileName} deleted`);
      this.defaultProfileName = undefined;
      this.availableProfiles = this.initFolder();
    } else {
      this.log(`%danger% Profile ${profile} doesn't exist`);
    }
  }

  private listProfile(): void {
    this.availableProfiles = this.initFolder();
    this.log('%info% List of Profiles :');
    this.availableProfiles.forEach((profile) => {
      if (profile.replace('.json', '') === this.defaultProfileName) {
        this.log(`${profile} %grey%*default`, 2);
      }
    });
  }

  protected mergeProfileWithARGV(): void {
    if (!this.defaultProfile) throw new BinError('Problem in control flow : mergeProfileWithARGV');
    if (this.program.host) this.defaultProfile[0].host = this.program.host;
    if (this.program.port) this.defaultProfile[0].port = this.program.port;
    if (this.program.path) this.defaultProfile[0].path = this.program.path;
    if (this.program.nickname) this.defaultProfile[0].nickname = this.program.nickname;
    if (this.program.channel) this.defaultProfile[0].chan = this.program.channel;
    if (this.program.retry) this.defaultProfile[0].retry = this.program.retry;
    if (this.program.passivePort) this.defaultProfile[0].passivePort = [this.program.passivePort];
    if (this.program.bot) this.defaultProfile[1].bot = this.program.bot;
    this.defaultProfile[0].randomizeNick = this.program.randomize || false;
    this.defaultProfile[1].wait = this.program.wait;
    this.defaultProfile[0].botNameMatch = this.program.botNameMatch || false;
  }
}
