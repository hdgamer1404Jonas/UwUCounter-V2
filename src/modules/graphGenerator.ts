import Canvas from "@napi-rs/canvas";

type array = {
    date: string,
    count: number
}

async function createGraph(array: array[]) {
    // only get the last 20 entries
    const rows = array.slice(Math.max(array.length - 20, 0));

    
    //create a canvas
    const canvas = Canvas.createCanvas(2000, 500);
    const ctx = canvas.getContext("2d");
    //set the background color
    ctx.fillStyle = "#2C2F33";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //get the highest count
    let highest = 0;
    //@ts-ignore
    for (let i = 0; i < rows.length; i++) {
        //@ts-ignore
        if (rows[i].count > highest) highest = rows[i].count;
    }

    
    //the graph is 20 days long, so we need to divide the canvas width by 20 and we want to have 60 px on the edges
    const x = (canvas.width - 120) / 20;
    //the graph is 20 days long, so we need to divide the canvas height by 20 and we want to have 60 px on the edges
    const y = (canvas.height - 120) / highest;

    //draw a line on the top and on the bottom
    ctx.strokeStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.lineTo(canvas.width - 60, 60);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(60, canvas.height - 60);
    ctx.lineTo(canvas.width - 60, canvas.height - 60);
    ctx.stroke();

    //write the days on the x axis like this: -19d, -18d, -17d, -16d, -15d, -14d, -13d, -12d, -11d, -10d, -9d, -8d, -7d, -6d, -5d, -4d, -3d, -2d, -1d, today, leave 120px on the right side
    ctx.font = "30px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    for (let i = 0; i < 20; i++) {
        ctx.fillText(`-${20 - i}d`, 60 + (x * i), canvas.height - 30);
        //also draw a line on the x axis with lower opacity
        ctx.strokeStyle = "#FFFFFF";
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.moveTo(60 + (x * i), 60);
        ctx.lineTo(60 + (x * i), canvas.height - 60);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    //write the count on the y axis, 5 times, so 5 lines, 5 labels on the right side
    for (let i = 0; i < 5; i++) {
        ctx.font = "20px Arial";
        ctx.globalAlpha = 1;
        ctx.fillText(`${Math.floor(highest / 5 * i)}`, canvas.width - 40, canvas.height - 60 - (y * highest / 5 * i));
        ctx.strokeStyle = "#FFFFFF";
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.moveTo(60, canvas.height - 60 - (y * highest / 5 * i));
        ctx.lineTo(canvas.width - 60, canvas.height - 60 - (y * highest / 5 * i));
        ctx.stroke();
    }

    //set the thickness of the line
    ctx.lineWidth = 5;
    //set the opacity of the line
    ctx.globalAlpha = 1;

    //random color
    ctx.strokeStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

    //for each day, draw a line from the previous day to the current day, if there is no previous day, just draw a line to the bottom, start on the right side
    //@ts-ignore
    for (let i = 0; i < rows.length; i++) {
        if (i == 0) {
            ctx.beginPath();
            ctx.moveTo(canvas.width - 60, canvas.height - 60);
            //@ts-ignore
            ctx.lineTo(canvas.width - 60 - (x * i), canvas.height - 60 - (y * rows[i].count));
            ctx.stroke();
        } else {
            ctx.beginPath();
            //@ts-ignore
            ctx.moveTo(canvas.width - 60 - (x * (i - 1)), canvas.height - 60 - (y * rows[i - 1].count));
            //@ts-ignore
            ctx.lineTo(canvas.width - 60 - (x * i), canvas.height - 60 - (y * rows[i].count));
            ctx.stroke();
        }
    }

    //create a buffer
    const buffer = canvas.toBuffer("image/png");

    //return the built canvas
    return buffer

}

export {
    createGraph
}