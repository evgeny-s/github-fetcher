import {Fetcher} from './fetcher.js';
import dotenv from 'dotenv';

dotenv.config();

const fetcher = new Fetcher();
fetcher.run();