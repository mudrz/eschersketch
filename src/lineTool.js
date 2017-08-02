//------------------------------------------------------------------------------
//
// Eschersketch - A drawing program for exploring symmetrical designs
//
//
// Copyright (c) 2017 Anselm Levskaya (http://anselmlevskaya.com)
// Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
// license.
//
//------------------------------------------------------------------------------

// DRAWING GLOBALS
import {gS, gConstants,
        livecanvas, lctx, canvas, ctx,
        affineset, updateTiling,
        commitOp
       } from './main';
import { _ } from 'underscore';
import {l2dist} from './math_utils';


// Draw Single Line Segments
//------------------------------------------------------------------------------
export class LineOp {
  constructor(ctxStyle, start, end) {
    this.ctxStyle = ctxStyle;
    this.tool = "line";
    this.start = start;
    this.end = end;
    this.symstate = gS.params.symstate;
    this.gridstate = _.clone(gS.gridstate);
  }

  render(ctx){
    _.assign(ctx, this.ctxStyle);
    updateTiling(this.symstate, this.gridstate);
    for (let af of affineset) {
      const Tp1 = af.on(this.start.x, this.start.y);
      const Tp2 = af.on(this.end.x, this.end.y);
      ctx.beginPath();
      ctx.moveTo(Tp1[0], Tp1[1]);
      ctx.lineTo(Tp2[0], Tp2[1]);
      ctx.stroke();
    }
  }

  serialize(){
    return ["line", this.start, this.end];
  }

  deserialize(data){
    return new LineOp(data[1], data[2]);
  }
}

//State Labels
const _INIT_ = 0;
const _OFF_  = 1;
const _ON_   = 2;
const _MOVESTART_ = 3;
const _MOVEEND_ = 4;

export class LineTool {
  constructor() {
    this.start = {};
    this.end = {};
    this.state = _INIT_;
    this.hitRadius = 4;
  }

  liverender() {
    lctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let af of affineset) {
      const Tp1 = af.on(this.start.x, this.start.y);
      const Tp2 = af.on(this.end.x, this.end.y);
      lctx.beginPath();
      lctx.moveTo(Tp1[0], Tp1[1]);
      lctx.lineTo(Tp2[0], Tp2[1]);
      lctx.stroke();
    }
    lctx.save();
    lctx.fillStyle = "rgba(255,0,0,0.2)";
    lctx.lineWidth = 1.0;
    lctx.strokeStyle = "rgba(255,0,0,1.0)";
    lctx.beginPath();
    lctx.arc(this.start.x-1, this.start.y-1, this.hitRadius, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();
    lctx.beginPath();
    lctx.arc(this.end.x-1, this.end.y-1, this.hitRadius, 0, 2*Math.PI);
    lctx.stroke();
    lctx.fill();
    lctx.restore();
  }

  commit() {
    if(this.state == _INIT_){return;}
    let ctxStyle = _.assign({}, _.pick(lctx, ...gConstants.CTXPROPS));
    commitOp(new LineOp(ctxStyle, this.start, this.end));
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
  }

  cancel() {
    lctx.clearRect(0, 0, livecanvas.width, livecanvas.height);
    this.state = _INIT_;
    this.start = {};
    this.end = {};
  }

  mouseDown(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if(l2dist(pt,[this.start.x,this.start.y])<this.hitRadius) {
      this.state = _MOVESTART_;
    } else if(l2dist(pt,[this.end.x,this.end.y])<this.hitRadius) {
      this.state = _MOVEEND_;
    } else {
      if(this.state==_OFF_) {
        this.commit();
      }
      this.state = _ON_;
      this.start = { x: pt[0], y: pt[1] };
    }
  }

  mouseMove(e) {
    let rect = livecanvas.getBoundingClientRect();
    let pt = [e.clientX-rect.left, e.clientY-rect.top];
    if (this.state == _ON_) {
        this.end = { x: pt[0], y: pt[1] };
        this.liverender();
    }
    else if (this.state == _MOVESTART_) {
      this.start = { x: pt[0], y: pt[1] };
      this.liverender();
    }
    else if (this.state == _MOVEEND_) {
      this.end = { x: pt[0], y: pt[1] };
      this.liverender();
    }
  }

  mouseUp(e) {
    this.state = _OFF_;
  }

  //mouseLeave(e) {
  //  this.exit();
  //}

  keyDown(e) {
    if(e.code == "Enter"){
      this.state = _OFF_;
      this.commit();
      this.start = {};
      this.end = {};
    } else if(e.code=="Escape"){
      this.cancel();
    }
  }
  enter(op){
    if(op){
        _.assign(gS.ctxStyle, _.clone(op.ctxStyle));
        _.assign(lctx, op.ctxStyle);
        this.ctxStyle = _.clone(op.ctxStyle); //not really necessary...
        _.assign(gS.gridstate, op.gridstate);
        gS.params.symstate = op.symstate;
        updateTiling(op.symstate, op.gridstate);
        this.start = op.start;
        this.end = op.end;
        this.state = _OFF_;
        this.liverender();
    } else{
      this.start = {};
      this.end = {};
      this.state = _INIT_;
    }
  }

  exit(){
    if(this.state==_OFF_) {
      //this.commit();
      this.start = {};
      this.end = {};
      this.state = _INIT_;
    }
  }
}