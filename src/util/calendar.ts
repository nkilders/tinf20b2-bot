import { ColorResolvable, MessageEmbed } from "discord.js";
import { CalendarResponse, parseICS, VEvent } from "node-ical";
import * as https from 'https';

const EMBED_TYPE_NEW: IEmbedType = { title: 'Neu', color: '#26de81' };
const EMBED_TYPE_UPDATE: IEmbedType = { title: 'Geändert', color: '#fed330' };
const EMBED_TYPE_DELETE: IEmbedType = { title: 'Gelöscht', color: '#eb3b5a' };

interface IEmbedType {
    title: string;
    color: ColorResolvable;
}

interface IEvent {
    location: string;
    start: Date;
    end: Date;
}

export interface ICalendar {
    [key:string]: IEvent[];
}

export function fetchRapla(user: string, file: string): Promise<string | null> {
    return new Promise(resolve => {
        const url = `https://rapla.dhbw-karlsruhe.de/rapla?page=ical&user=${user}&file=${file}`;

        https.get(url, resp => {
            let buffer = '';

            resp.on('data', data => buffer += data )
                .on('close', ()  => resolve(buffer) )
                .on('error', ()  => resolve(null) );
        });
    });
}

function freqToDeltaMs(freq: number): number {
    switch(freq) {
        // Weekly
        case 2: return 1000 * 60 * 60 * 24 * 7;
        // Daily
        case 3: return 1000 * 60 * 60 * 24;
        default: return 0;
    }
}

function exdateToArray(event: VEvent): Date[] {
    if(!event.exdate) return [];

    const ret: Date[] = [];

    for(const exdate of Object.values(event.exdate)) {
        if(!(exdate instanceof Date)) continue;

        ret.push(exdate);
    }

    return ret;
}

export function parseCalendar(calendar: string): ICalendar {
    const cal = parseICS(calendar);

    const output: ICalendar = {};

    for(const event of Object.values(cal)) {
        if(event.type !== 'VEVENT') continue;

        // Startzeit des ersten Events der Reihe
        const startTime = event.start.getTime();
        // Endzeit des ersten Events der Reihe
        const endTime   = event.end.getTime();

        const rr        = event.rrule;
        // Anzahl aller Events in der Reihe
        const count     = rr && rr.options.count    || 1;
        // Frequenz: Events täglich, wöchentlich, ...
        const freq      = rr && rr.options.freq     || 1;
        // Interval: Events alle x Tage/Wochen/...
        const interval  = rr && rr.options.interval || 1;

        // Zeitabstand zwischen Events der Reihe in ms
        const baseDelta = freqToDeltaMs(freq) * interval;

        // Liste aller Zeitpunkte (Startzeiten), an denen das Event nicht statfindet
        const exdate    = exdateToArray(event);
        
        for(let i = 0; i < count; i++) {
            // Zeitdifferenz zu erstem Event der Reihe in ms
            const fullDelta = baseDelta * i;
            // Startzeit des i-ten Events der Reihe
            const start     = new Date(startTime + fullDelta);
            // Endzeit des i-ten Events der Reihe
            const end       = new Date(endTime + fullDelta);

            // Vergangene Events ignorieren
            if(start.getTime() < Date.now()) continue;

            // Events in exdate ignorieren
            if(exdate.some(d => d.getTime() === start.getTime())) continue;
            
            if(!output[event.summary]) output[event.summary] = [];

            output[event.summary].push(
                <IEvent>{
                    location: event.location,
                    start: start,
                    end: end,
                }
            );
        }
    }

    return output;
}

export function compareCalendars(oldCal: ICalendar, newCal: ICalendar): MessageEmbed[] {
    const embeds: MessageEmbed[] = [];

    const newKeys = Object.keys(newCal).filter(key => !oldCal[key]);
    compareUncommonKeys(newKeys, newCal, EMBED_TYPE_NEW).forEach(e => embeds.push(e));

    const removedKeys = Object.keys(oldCal).filter(key => !newCal[key]);
    compareUncommonKeys(removedKeys, oldCal, EMBED_TYPE_DELETE).forEach(e => embeds.push(e));

    const commonKeys = Object.keys(oldCal).filter(key => !!newCal[key]);
    compareCommonKeys(commonKeys, oldCal, newCal).forEach(e => embeds.push(e));

    return embeds;
}

function compareUncommonKeys(keys: string[], cal: ICalendar, type: IEmbedType): MessageEmbed[] {
    const output: MessageEmbed[] = [];

    for(const key of keys) {
        const events = cal[key].sort((a, b) => a.start.getTime() - b.start.getTime());

        output.push(
            buildEmbed(key, events[0].start, events[0].end, events[0].location, events.length, type)
        );
    }

    return output;
}

function compareCommonKeys(keys: string[], oldCal: ICalendar, newCal: ICalendar): MessageEmbed[] {
    const output: MessageEmbed[] = [];

    for(const key of keys) {
        const oldEvents = oldCal[key];
        const newEvents = newCal[key];

        if(oldEvents.length < newEvents.length) {
            // Neue Events sind dazugekommen

            // Neue Events bestimmen und chronologisch sortieren
            const events = newEvents
                .filter(e => !oldEvents.find(e2 => e.start === e2.start && e.end === e2.end))
                .sort((a, b) => a.start.getTime() - b.start.getTime());

            if(events.length > 0) {
                output.push(
                    buildEmbed(key, events[0].start, events[0].end, events[0].location, newEvents.length - oldEvents.length, EMBED_TYPE_NEW)
                );
            }
        } else if(oldEvents.length > newEvents.length) {
            // Events wurden gelöscht

            // Gelöschte Events bestimmen und chronologisch sortieren
            const events = oldEvents
                .filter(e => !newEvents.find(e2 => e.start === e2.start && e.end === e2.end))
                .sort((a, b) => a.start.getTime() - b.start.getTime());
            
            if(events.length > 0) {
                output.push(
                    buildEmbed(key, events[0].start, events[0].end, events[0].location, oldEvents.length - newEvents.length, EMBED_TYPE_DELETE)
                );
            }
        } else {
            // Anzahl Events ist gleich; Räume und Daten werden verglichen

            // Raum
            const newRoom = newEvents.filter(
                e => !oldEvents.find(e2 => e.location === e2.location)
            );
            
            // Start/End
            const newTime = newEvents.filter(
                e => !oldEvents.find(
                    e2 => e.start.getTime() === e2.start.getTime()
                       && e.end.getTime() === e2.end.getTime()
                )
            ).sort((a, b) => a.start.getTime() - b.start.getTime());

            // Überspringen, wenn sich nicht geändert hat
            const roomUpdate = newRoom.length > 0;
            const timeUpdate = newTime.length > 0;
            if(!roomUpdate && !timeUpdate) continue;
            
            const room = roomUpdate ? newRoom[0].location : oldEvents[0].location;

            const start = timeUpdate ? newTime[0].start : oldEvents[0].start;
            const end = timeUpdate ? newTime[0].end : oldEvents[0].end;

            const count = Math.max(newRoom.length, newTime.length);

            output.push(
                buildEmbed(key, start, end, room, count, EMBED_TYPE_UPDATE)
            );
        }
    }

    return output;
}

function buildEmbed(title: string, start: Date, end: Date, room: string, count: number, type: IEmbedType) {
    if(room === '') room = '/';
    
    return new MessageEmbed()
        .setAuthor({
            name: type.title,
        })
        .setTitle(title)
        .addFields([
            {
                name: 'von',
                value: formatDate(start),
                inline: true,
            },
            {
                name: 'bis',
                value: formatDate(end),
                inline: true,
            },
            {
                name: 'Raum',
                value: room,
                inline: false,
            },
        ])
        .setColor(type.color)
        .setFooter({
            text: count > 1 ? `Und ${count-1} Weitere...` : '',
        });
}

function formatDate(d: Date): string {
    return `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes() === 0 ? '00' : d.getMinutes()} Uhr`;
}