import { ColorResolvable, MessageEmbed } from "discord.js";
import { parseICS, VEvent } from "node-ical";
import * as https from 'https';

const EMBED_TYPE_NEW:    IEmbedType = { title: 'Neu',      color: '#26de81' };
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
        // Yearly
        case 0: return 1000 * 60 * 60 * 24 * 365;
        // Monthly
        case 1: return 1000 * 60 * 60 * 24 * 30;
        // Weekly
        case 2: return 1000 * 60 * 60 * 24 * 7;
        // Daily
        case 3: return 1000 * 60 * 60 * 24;
        // Hourly
        case 4: return 1000 * 60 * 60;
        // Minutely
        case 5: return 1000 * 60;
        // Secondly
        case 6: return 1000;

        default: return 0;
    }
}


function exdateToArray(event: VEvent): Date[] {
    if(!event.exdate) return [];

    const arr: Date[] = [];

    for(const exdate of Object.values(event.exdate)) {
        if(!(exdate instanceof Date)) continue;

        arr.push(exdate);
    }

    return arr;
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

    // Existieren Vorlesungs-Reihen in newCal, die es nicht in oldCal gibt,
    // so wurden diese neu erstellt und müssen ausgegeben werden.
    const newSeries = Object.keys(newCal).filter(key => !oldCal[key]);
    compareLonelySeries(newSeries, newCal, EMBED_TYPE_NEW).forEach(e => embeds.push(e));

    // Existieren Vorlesungs-Reihen in oldCal, die es nicht in newCal gibt,
    // so wurden diese gelöscht und müssen ausgegeben werden.
    const removedSeries = Object.keys(oldCal).filter(key => !newCal[key]);
    compareLonelySeries(removedSeries, oldCal, EMBED_TYPE_DELETE).forEach(e => embeds.push(e));

    // Existieren Vorlesungs-Reihen, die es sowohl in oldCal als auch newCal gibt,
    // so müssen die einzelnen Termine dieser Reihen verglichen werden, um Unterschiede zu finden.
    const commonSeries = Object.keys(oldCal).filter(key => !!newCal[key]);
    compareCommonSeries(commonSeries, oldCal, newCal).forEach(e => embeds.push(e));

    return embeds;
}

function compareLonelySeries(series: string[], cal: ICalendar, type: IEmbedType): MessageEmbed[] {
    const embeds: MessageEmbed[] = [];

    for(const ser of series) {
        const events = sortByStartTime(cal[ser]);

        embeds.push(
            buildEmbed(ser, events[0].start, null, events[0].end, null, events[0].location, null, events.length, type)
        );
    }

    return embeds;
}

function compareCommonSeries(series: string[], oldCal: ICalendar, newCal: ICalendar): MessageEmbed[] {
    const embeds: MessageEmbed[] = [];

    for(const ser of series) {
        const oldEvents = sortByStartTime(oldCal[ser]);
        const newEvents = sortByStartTime(newCal[ser]);

        if(oldEvents.length < newEvents.length) {
            // Anzahl der Termine ist größer geworden
            // => Neue Termine sind dazugekommen
            const embed = compareCommonSeriesNew(ser, oldEvents, newEvents);
            if(embed) embeds.push(embed);
        } else if(oldEvents.length > newEvents.length) {
            // Anzahl der Termine ist kleiner geworden
            // => Termine wurden gelöscht
            const embed = compareCommonSeriesDeleted(ser, oldEvents, newEvents);
            if(embed) embeds.push(embed);
        } else {
            // Anzahl der Termine ist gleich geblieben
            // => Start-/Endzeitpunkte und Räume müssen verglichen werden, um Unterschiede zu finden
            const embed = compareCommonSeriesEqual(ser, oldEvents, newEvents);
            if(embed) embeds.push(embed);
        }
    }

    return embeds;
}

function compareCommonSeriesNew(ser: string, oldEvents: IEvent[], newEvents: IEvent[]): MessageEmbed | null {
    // Neue Termine ermitteln
    const events = newEvents.filter(e => !oldEvents.find(e2 => e.start === e2.start && e.end === e2.end));

    // Falls keine Termine gefunden wurden, kann abgebrochen werden
    if(events.length === 0) return null;

    return buildEmbed(ser, events[0].start, null, events[0].end, null, events[0].location, null, newEvents.length - oldEvents.length, EMBED_TYPE_NEW);
}

function compareCommonSeriesDeleted(ser: string, oldEvents: IEvent[], newEvents: IEvent[]): MessageEmbed | null {
    // Gelöschte Termine ermitteln
    const events = oldEvents.filter(e => !newEvents.find(e2 => e.start === e2.start && e.end === e2.end));

    // Falls keine Termine gefunden wurden, kann abgebrochen werden
    if(events.length === 0) return null;

    return buildEmbed(ser, events[0].start, null, events[0].end, null, events[0].location, null, oldEvents.length - newEvents.length, EMBED_TYPE_DELETE);
}

function compareCommonSeriesEqual(ser: string, oldEvents: IEvent[], newEvents: IEvent[]): MessageEmbed | null {
    // Termine ermitteln, die ausschließlich in oldEvents vorkommen
    const oldExplicit = oldEvents.filter(e => !newEvents.find(e2 => 
        e.start.getTime() === e2.start.getTime() &&
        e.end.getTime()   === e2.end.getTime() &&
        e.location        === e2.location
    ));

    // Termine ermitteln, die ausschließlich in newEvents vorkommen
    const newExplicit = newEvents.filter(e => !oldEvents.find(e2 => 
        e.start.getTime() === e2.start.getTime() &&
        e.end.getTime()   === e2.end.getTime() &&
        e.location        === e2.location
    ));

    // Falls es keine Termine gibt, die ausschließlich in oldEvents oder newEvents vorkommen,
    // gab es auch keine Änderungen und es muss kein Embed erzeugt werden
    if(oldExplicit.length === 0 || newExplicit.length === 0) return null;

    const o = oldExplicit[0];
    const n = newExplicit[0];

    const [oLoc, nLoc]     = [o.location, (o.location === n.location) ? null : n.location];
    const [oStart, nStart] = [o.start, (o.start.getTime() === n.start.getTime()) ? null : n.start];
    const [oEnd, nEnd]     = [o.end, (o.end.getTime() === n.end.getTime()) ? null : n.end];

    return buildEmbed(ser, oStart, nStart, oEnd, nEnd, oLoc, nLoc, oldExplicit.length, EMBED_TYPE_UPDATE);
}


function buildEmbed(title: string, oldStart: Date, newStart: Date | null, oldEnd: Date, newEnd: Date | null, oldRoom: string, newRoom: string | null, count: number, type: IEmbedType): MessageEmbed {
    if(oldRoom === '') oldRoom = '/';
    if(newRoom === '') newRoom = '/';
    
    const start = !!newStart ? `~~${formatDate(oldStart)}~~\n${formatDate(newStart)}` : formatDate(oldStart);
    const end   = !!newEnd   ? `~~${formatDate(oldEnd)}~~\n${formatDate(newEnd)}`     : formatDate(oldEnd);
    const room  = !!newRoom  ? `~~${oldRoom}~~\n${newRoom}`                           : oldRoom;

    return embedBase(title, count, type)
        .addFields([
            {
                name: 'von',
                value: start,
                inline: true,
            },
            {
                name: 'bis',
                value: end,
                inline: true,
            },
            {
                name: 'Raum',
                value: room,
                inline: false,
            },
        ]);
}
    
function embedBase(title: string, count: number, type: IEmbedType): MessageEmbed {
    return new MessageEmbed()
    .setAuthor({
        name: type.title,
    })
    .setTitle(title)
    .setColor(type.color)
    .setFooter({
        text: count > 1 ? `Und ${count-1} Weitere...` : '',
    });
}


function formatDate(d: Date): string {
    return `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes() === 0 ? '00' : d.getMinutes()} Uhr`;
}
    
function sortByStartTime(events: IEvent[]): IEvent[] {
    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}