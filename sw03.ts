/**
 * XinaBox SW03 extension for makecode
 */

/**
 * SW03 block
 */
//% color=#444444 icon="\uf2dc"
//% groups=['On start', 'Variables', 'Optional']
namespace SW03 {
    export enum Temperature {
        //% block="ºC"
        Celcius = 0,
        //% block="ºF"
        Fahrenheit = 1
    }

    export enum Pressure {
        //% block="hPa"
        HectoPascal = 0,
        //% block="mbar"
        MilliBar = 1,
        //% block="Pascal"
        Pascal = 2
    }

    export enum Length {
        //% block="meter"
        Meter = 0,
        //% block="feet"
        Feet = 1
    }
    let MPL3115A2_ADDRESS = 0x60 // Unshifted 7-bit I2C address for sensor

    const STATUS = 0x00
    const OUT_P_MSB = 0x01
    const OUT_P_CSB = 0x02
    const OUT_P_LSB = 0x03
    const OUT_T_MSB = 0x04
    const OUT_T_LSB = 0x05
    const DR_STATUS = 0x06
    const OUT_P_DELTA_MSB = 0x07
    const OUT_P_DELTA_CSB = 0x08
    const OUT_P_DELTA_LSB = 0x09
    const OUT_T_DELTA_MSB = 0x0A
    const OUT_T_DELTA_LSB = 0x0B
    const WHO_AM_I = 0x0C
    const F_STATUS = 0x0D
    const F_DATA = 0x0E
    const F_SETUP = 0x0F
    const TIME_DLY = 0x10
    const SYSMOD = 0x11
    const INT_SOURCE = 0x12
    const PT_DATA_CFG = 0x13
    const BAR_IN_MSB = 0x14
    const BAR_IN_LSB = 0x15
    const P_TGT_MSB = 0x16
    const P_TGT_LSB = 0x17
    const T_TGT = 0x18
    const P_WND_MSB = 0x19
    const P_WND_LSB = 0x1A
    const T_WND = 0x1B
    const P_MIN_MSB = 0x1C
    const P_MIN_CSB = 0x1D
    const P_MIN_LSB = 0x1E
    const T_MIN_MSB = 0x1F
    const T_MIN_LSB = 0x20
    const P_MAX_MSB = 0x21
    const P_MAX_CSB = 0x22
    const P_MAX_LSB = 0x23
    const T_MAX_MSB = 0x24
    const T_MAX_LSB = 0x25
    const CTRL_REG1 = 0x26
    const CTRL_REG2 = 0x27
    const CTRL_REG3 = 0x28
    const CTRL_REG4 = 0x29
    const CTRL_REG5 = 0x2A
    const OFF_P = 0x2B
    const OFF_T = 0x2C
    const OFF_H = 0x2D

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(MPL3115A2_ADDRESS, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(MPL3115A2_ADDRESS, reg, NumberFormat.UInt8BE, true);
        return pins.i2cReadNumber(MPL3115A2_ADDRESS, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(MPL3115A2_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(MPL3115A2_ADDRESS, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(MPL3115A2_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(MPL3115A2_ADDRESS, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(MPL3115A2_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(MPL3115A2_ADDRESS, NumberFormat.Int16LE);
    }

    function readBlock(reg: number, count: number): number[] {
        let buf: Buffer = pins.createBuffer(count);
        pins.i2cWriteNumber(MPL3115A2_ADDRESS, reg, NumberFormat.UInt8BE, true);
        buf = pins.i2cReadBuffer(MPL3115A2_ADDRESS, count);

        let tempbuf: number[] = [];
        for (let i: number = 0; i < count; i++) {
            tempbuf[i] = buf[i];
        }
        return tempbuf;
    }

    /**
     * The density altitude in meter or feet
     * https://en.wikipedia.org/wiki/Density_altitude
     * @param u the density altitude unit
     */
    //% block="SW03 altitude %u"
    //% group="Variables"
    //% weight=74 blockGap=8
    export function altitude(u: Length): number {
        toggleOneShot(); //Toggle the OST bit causing the sensor to immediately take another reading

        //Wait for PDR bit, indicates we have new pressure data
        let counter = 0;
        while ((getreg(STATUS) & (1 << 1)) == 0) {
            if (++counter > 600) return (-999); //Error out after max of 512ms for a read
            pause(1);
        }

        let res: number[] = readBlock(OUT_P_MSB, 3)
        let msb, csb, lsb: number
        msb = res[0]
        csb = res[1]
        lsb = res[2]
        // The least significant bytes l_altitude and l_temp are 4-bit,
        // fractional values, so you must cast the calulation in (float),
        // shift the value over 4 spots to the right and divide by 16 (since 
        // there are 16 values in 4-bits). 
        let tempcsb: number = (lsb >> 4) / 16.0;

        let altitude: number = ((msb << 8) | csb) + tempcsb;
        if (u == Length.Meter) return Math.roundWithPrecision(altitude, 2);
        else return Math.roundWithPrecision(altitude * 3.28084, 2);
    }

    /**
     * The density altitude in meter or feet
     * https://en.wikipedia.org/wiki/Density_altitude
     * @param u the density altitude unit
     */
    //% block="SW03 density altitude %u"
    //% group="Variables"
    //% weight=74 blockGap=8
    export function densityAltitude(u: Length): number {
        let alt = (Math.pow(101325 / pressure(Pressure.Pascal), 1 / 5.257) - 1.0) * (temperature(Temperature.Celcius) + 273.15) / 0.0065
        if (u == Length.Meter) return Math.roundWithPrecision(alt, 2);
        else return Math.roundWithPrecision(alt * 3.28084, 2);
    }

    /**
    * The pressure altitude in meter or feet
    * https://en.wikipedia.org/wiki/Pressure_altitude
    * @param u the pressure altitude unit
    */
    //% block="SW03 pressure altitude %u"
    //% group="Variables"
    //% weight=74 blockGap=8
    export function pressureAltitude(u: Length): number {
        let alt = (1 - Math.pow(pressure(Pressure.Pascal) / 101325, 0.190284)) * 145366.45
        if (u == Length.Feet) return Math.roundWithPrecision(alt, 2);
        else return Math.roundWithPrecision(alt * 0.3048, 2);
    }

    //% block="SW03 pressure %u"
    //% group="Variables"
    //% weight=74 blockGap=8
    export function pressure(u: Pressure): number {

        //Check PDR bit, if it's not set then toggle OST
        if ((getreg(STATUS) & (1 << 2)) == 0) toggleOneShot(); //Toggle the OST bit causing the sensor to immediately take another reading

        //Wait for PDR bit, indicates we have new pressure data
        let counter = 0;
        while ((getreg(STATUS) & (1 << 2)) == 0) {
            if (++counter > 600) return (-999); //Error out after max of 512ms for a read
            pause(1);
        }

        let res: number[] = readBlock(OUT_P_MSB, 3)
        let msb, csb, lsb: number
        msb = res[0]
        csb = res[1]
        lsb = res[2]

        toggleOneShot(); //Toggle the OST bit causing the sensor to immediately take another reading

        // Pressure comes back as a left shifted 20 bit number
        let pressure_whole: number = msb << 16 | csb << 8 | lsb;
        pressure_whole >>= 6; //Pressure is an 18 bit number with 2 bits of decimal. Get rid of decimal portion.

        lsb &= 0x30; //Bits 5/4 represent the fractional component
        lsb >>= 4; //Get it right aligned
        let pressure_decimal: number = lsb / 4.0; //Turn it into fraction

        let pressure: number = pressure_whole + pressure_decimal;

        if (u == Pressure.Pascal) {
            return pressure;
        }

        return Math.roundWithPrecision(pressure / 100, 2);
    }

    //% block="SW03 temperature %u"
    //% group="Variables"
    //% weight=74 blockGap=8
    export function temperature(u: Temperature): number {
        if ((getreg(STATUS) & (1 << 1)) == 0) toggleOneShot(); //Toggle the OST bit causing the sensor to immediately take another reading

        //Wait for TDR bit, indicates we have new temp data
        let counter = 0;
        while ((getreg(STATUS) & (1 << 1)) == 0) {
            if (++counter > 600) return (-999); //Error out after max of 512ms for a read
            pause(1);
        }

        let res: number[] = readBlock(OUT_T_MSB, 2)
        let msb, lsb: number;

        msb = res[0];
        lsb = res[1];

        toggleOneShot(); //Toggle the OST bit causing the sensor to immediately take another reading

        //Negative temperature fix by D.D.G.
        let foo = 0;
        let negSign = false;

        //Check for 2s compliment
        if (msb > 0x7F) {
            foo = ~((msb << 8) + lsb) + 1;  //2’s complement
            msb = foo >> 8;
            lsb = foo & 0x00F0;
            negSign = true;
        }

        // The least significant bytes l_altitude and l_temp are 4-bit,
        // fractional values, so you must cast the calulation in (float),
        // shift the value over 4 spots to the right and divide by 16 (since 
        // there are 16 values in 4-bits). 
        let templsb = (lsb >> 4) / 16.0; //temp, fraction of a degree

        let temperature = (msb + templsb);

        if (negSign) temperature = 0 - temperature;

        if (u == Temperature.Celcius) return Math.roundWithPrecision(temperature, 2);
        else return Math.roundWithPrecision(32 + temperature * 9 / 5, 2);
    }

    //% block="SW03 barometer mode"
    //% group="On Start"
    //% weight=74 blockGap=8
    export function setModeBarometer(): void {
        setOversampleRate(7);
        enableEventFlags();
        let tempSetting = getreg(CTRL_REG1); //Read current settings
        tempSetting &= ~(1 << 7); //Clear ALT bit
        setreg(CTRL_REG1, tempSetting);
    }

    //% block="SW03 altimeter mode"
    //% group="On Start"
    //% weight=74 blockGap=8
    export function setModeAltimeter(): void {

        let tempSetting = getreg(CTRL_REG1); //Read current settings
        tempSetting |= (1 << 7); //Set ALT bit
        setreg(CTRL_REG1, tempSetting);
    }

    //% block="SW03 standby mode"
    //% group="Optional"
    //% weight=74 blockGap=8
    export function setModeStandby(): void {
        let tempSetting = getreg(CTRL_REG1); //Read current settings
        tempSetting &= ~(1 << 0); //Clear SBYB bit for Standby mode
        setreg(CTRL_REG1, tempSetting);
    }

    //% block="SW03 active mode"
    //% group="Optional"
    //% weight=74 blockGap=8
    export function setModeActive(): void {
        let tempSetting = getreg(CTRL_REG1); //Read current settings
        tempSetting |= (1 << 0); //Set SBYB bit for Active mode
        setreg(CTRL_REG1, tempSetting);
    }

    //% block="SW03 oversample rate %u"
    //% group="Optional"
    //% advanced=true
    //% weight=74 blockGap=8
    export function setOversampleRate(sampleRate: number): void {
        if (sampleRate > 7) sampleRate = 7; //OS cannot be larger than 0b.0111
        sampleRate <<= 3; //Align it for the CTRL_REG1 register

        let tempSetting = getreg(CTRL_REG1); //Read current settings
        tempSetting &= 0xC7; //Clear out old OS bits
        tempSetting |= sampleRate; //Mask in new OS bits
        setreg(CTRL_REG1, tempSetting);
    }

    //% block="SW03 enable event flags"
    //% group="Optional"
    //% advanced=true
    //% weight=74 blockGap=8  
    export function enableEventFlags(): void {
        setreg(PT_DATA_CFG, 0x07); // Enable all three pressure and temp event flags 
    }

    function toggleOneShot(): void {
        let tempSetting = getreg(CTRL_REG1); //Read current settings
        tempSetting &= ~(1 << 1); //Clear OST bit
        setreg(CTRL_REG1, tempSetting);

        tempSetting = getreg(CTRL_REG1); //Read current settings to be safe
        tempSetting |= (1 << 1); //Set OST bit
        setreg(CTRL_REG1, tempSetting);
    }

    setOversampleRate(7);
}
