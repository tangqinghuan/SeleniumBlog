var $ = function (id) {
        return document.getElementById(id)
    },
    MouseButton = LeftMouse = 0,
    FlagImg = new Image(),
    HappyImg = new Image(),
    MineImg = new Image(),
    SadImg = new Image(),
    SuccessImg = new Image(),

    WhichButton = function (e) {
        e = e || window.event;
        var b = getOs();
        if (b != 2) { //非FF
            switch (e.button) {
                case 2:
                    return 0;
                case 0:
                    return b == 1 ? 0 : 1; //b==1,IE
                default:
                    return 1;
            }
        } else { //FF
            return e.which == 3 ? 0 : 1;
        }
    },

    OMine = {
        MaxX: 9, MaxY: 9,//最大的坐标
        MineCount: 10,//定义雷的个数,可改
        FlagCount: 0, //已经标记的旗子的数量
        OpenedCount: 0, //已经打开的地区的数量
        MaxOpenCount: 0,//应该要打开的最大地区数量
        //当OpenedCount=MaxOpenCount&&FlagCount=MineCount的时候,判断游戏成功结束
        Mine: [],
        GameOver: false, //true代表游戏失败结束
        Success: false, //true代表游戏成功结束
        aClear: [],//临时开雷的数组

        //刷新网页的时候初始化
        fInit: function () {
            var T = this, MaxX = T.MaxX, MaxY = T.MaxY, nX, nY = MaxY, MineCount = T.MineCount,
                AStr = ['<table bordercolor="#000000" border="0" cellpadding="0" cellspacing="0" height="' + 20 * MaxY + 'px" width="' + 20 * MaxX + 'px" style="border: 10px #a0a0a0">'],
                i = 0, TAr, TMine = T.Mine;
            T.MaxOpenCount = MaxX * MaxY - MineCount;
            while (nY--) {
                AStr[++i] = '<tr>';
                TAr = TMine[nY] = [];
                nX = MaxX;
                while (nX--) {
                    AStr[++i] = '<td class="Normal" onmousedown="OMine.fMouseDown(' + nX + ',' + nY + ',event);" onmouseup="OMine.fMouseUp(' + nX + ',' + nY + ',event);" onmouseover="OMine.fButtonMouseOver(' + nX + ',' + nY + ')" onmouseout="OMine.fButtonMouseOut(' + nX + ',' + nY + ')" id="Img' + nX + '_' + nY + '">　</td>';
                    TAr[nX] = {
                        Mine: 0, //0表示没有雷,1表示有雷
                        State: 0,//0表示未开启,1表示左键开启,2表示右键标记
                        MineCount: 0//周围有几个雷
                    }
                }
                AStr[++i] = '</tr>';
            }
            AStr[++i] = '</table>';
            $('dMap').innerHTML = T.InitStr = AStr.join('');
            $('txtFlagCount').value = MineCount;
            T.fInitMine();
            $('btnRefreshMap').src = 'happy.gif';
            T.GameOver = T.Success = false;
            T.OpenedCount = T.FlagCount = T.aClear.lenght = 0;
        },

        //为了方便循环赋值,给表格数组赋值的时候是XY倒过来循环的,所以调用的时候要倒回去
        //比如要获得该格子是否有雷,用OMine.fGetMine(x,y).Mine;
        fGetMine: function (X, Y) {
            return this.Mine[Y][X]
        },

        //仅当按重新开始的按钮，不初始化大表格字符
        fRefreshMap: function () {
            var T = this;
            $('dMap').innerHTML = T.InitStr;
            T.fResetOMine();//必须先重置OMine,再重置99个雷
            T.fInitMine();
            T.GameOver = T.Success = false;
            $('btnRefreshMap').src = 'happy.gif';
            $('txtFlagCount').value = T.MineCount;
            T.OpenedCount = T.FlagCount = T.aClear.lenght = 0;
        },

        //重置OMine.Mine数组
        fResetOMine: function () {
            var T = this, MaxY = T.MaxY, MaxX = T.MaxX, X, Y = MaxY, M, Mine = T.Mine, TAr;
            while (Y--) {
                X = MaxX;
                TAr = Mine[Y];
                while (X--)(M = TAr[X]).Mine = M.State = M.MineCount = 0;
            }
        },

        //初始化雷的数组
        fInitMine: function () {
            var T = this, MaxX = T.MaxX, MaxY = T.MaxY, a, fGetMine = T.fGetMine,
                aOld = [], x, y = MaxY, n = 0, l = T.MineCount, xRand; //一个随机数字
            while (y--) {
                x = MaxX;
                while (x--)aOld[n++] = [x, y];
            }
            while (l--) {
                a = aOld[xRand = Math.floor(Math.random() * (n - 1))];
                T.fGetMine(a[0], a[1]).Mine = 1;
                aOld.splice(xRand, 1);
                --n;
            }
        },

        //鼠标移动到某格子的时候
        fButtonMouseOver: function (X, Y) {
            var T = this;
            switch (MouseButton) {
                case 2://双键按下的状态
                    var arr = T.fGetAround(X, Y), i = arr.length, TAr;
                    while (i--)T.fButtonDown((TAr = arr[i])[0], TAr[1]);
                case 1:
                    LeftMouse == 1 && T.fButtonDown(X, Y); //左键是按下的
            }
        },

        //鼠标移出某格子的时候
        fButtonMouseOut: function (X, Y) {
            var T = this;
            switch (MouseButton) {
                case 2://双键按下的状态
                    var arr = T.fGetAround(X, Y), i = arr.length, TAr;
                    while (i--)T.fButtonUp((TAr = arr[i])[0], TAr[1]);
                case 1:
                    LeftMouse == 1 && T.fButtonUp(X, Y); //左键是按下的
            }
        },

        //鼠标按下时没被开启的格子呈现被按下
        fButtonDown: function (X, Y) {
            var srcEle = $('Img' + X + '_' + Y);
            srcEle.className == 'Normal' && (srcEle.className = 'M0');
        },

        //让没被开启并且已经呈现被按下的格子回复Normal
        fButtonUp: function (X, Y) {
            var srcEle = $('Img' + X + '_' + Y);
            srcEle.className == 'M0' && !this.fGetMine(X, Y).State && (srcEle.className = 'Normal');
        },

        //获取8个方向的坐标
        fGetAround: function (X, Y) {
            var TX, TY, i = 8, MX = this.MaxX - 1, MY = this.MaxY - 1,
                Arr = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]],
                newArr = [], TAr;
            while (i--) {
                TX = X + (TAr = Arr[i])[0];
                TY = Y + TAr[1];
                !(TX < 0 || TX > MX || TY < 0 || TY > MY) && newArr.push([TX, TY]);
            }
            return newArr;
        },

        //鼠标在格子按下
        fMouseDown: function (X, Y, evt) {
            var T = this;
            if (T.GameOver) {
                alert('游戏失败,再接再厉!');
                return;
            }
            if (T.Success) {
                alert('恭喜游戏成功!再来一局吧？');
                return;
            }
            var srcEle = $('Img' + X + '_' + Y), ObXY = T.fGetMine(X, Y), arr, i, TAr;
            ++MouseButton;
            evt = evt || window.event;
            switch (MouseButton) {
                case 2:
                    arr = T.fGetAround(X, Y);
                    i = arr.length;
                    while (i--)T.fButtonDown((TAr = arr[i])[0], TAr[1]);
                    break;
                case 1:
                    if (WhichButton(evt)) {
                        LeftMouse = 1;
                        T.fButtonDown(X, Y);
                    } else {
                        switch (ObXY.State) {
                            case 0:
                                ObXY.State = 2;
                                srcEle.className = 'Flag';
                                --$('txtFlagCount').value;
                                ++T.FlagCount;
                                break;
                            case 2:
                                ObXY.State = 0;
                                srcEle.className = 'Normal';
                                ++$('txtFlagCount').value;
                                --T.FlagCount;
                        }
                    }
            }
        },

        //鼠标在格子弹起
        fMouseUp: function (X, Y, evt) {
            var T = this;
            evt = evt || window.event;
            var srcEle = $('Img' + X + '_' + Y), ObXY = T.fGetMine(X, Y), arr, i, TAr;
            switch (MouseButton) {
                case 2: //MouseDown为两个键都单击按下，任意一个键弹起都判断为双键弹起
                    LeftMouse = 0;
                    //鼠标弹起，把呈现被按下状态的格子恢复
                    arr = T.fGetAround(X, Y);
                    i = arr.length;
                    while (i--)T.fButtonUp((TAr = arr[i])[0], TAr[1]);
                    !ObXY.State && T.fButtonUp(X, Y);
                    ObXY.State == 1 && ObXY.MineCount && T.fOpenFlagMine(X, Y);
                    break;
                case 1: //当MouseDown为一个键单击时，MouseUp才判断为一个键弹起
                    if (WhichButton(evt)) {
                        //只有在State=0才起作用,跟是否有雷没关系
                        LeftMouse = 0;
                        if (ObXY.State) {
                            break;
                        }
                        ObXY.Mine ? (
                            //触雷,结束该局
                            T.fFail(),
                                srcEle.className = 'Boom'
                        ) : (
                            ObXY.State = 1, //压栈之前就要设置为已经开启
                                T.aClear.push([X, Y]),
                                T.fClearMine()
                        )
                    }
            }
            MouseButton = 0;
            if (T.OpenedCount == T.MaxOpenCount && T.FlagCount == T.MineCount) {
                T.fSuccess();
                alert('恭喜游戏成功!再来一局吧？');
                return;
            }
            //当剩余未开启的格子数＝剩余的旗子数，自动完成
            T.MaxOpenCount + T.MineCount - T.OpenedCount - T.FlagCount == $('txtFlagCount').value && (
                T.fSuccess(),
                    T.fAutoFlag(),
                    alert('恭喜游戏成功!再来一局吧？')
            )
        },

        //自动填充未开启的地区的雷
        fAutoFlag: function () {
            var T = this, nX, nY = T.MaxY, MaxX = T.MaxX, Mine = T.Mine, TAr;
            while (nY--) {
                nX = MaxX;
                TAr = Mine[nY];
                while (nX--)!TAr[nX].State && ($('Img' + nX + '_' + nY).className = 'Flag');
            }
            $('txtFlagCount').value = 0;
        },

        //递归开雷
        fClearMine: function () {
            var T = this;
            if (T.aClear.length == 0) {
                return
            }
            ++T.OpenedCount;
            var aXY = T.aClear.pop(), X = aXY[0], Y = aXY[1], TX, TY,
                aTmpClear = [], //一个临时数组
                srcEle = $('Img' + X + '_' + Y),
                ObXY, ObTXTY,
                countMine = 0, //获取周围雷的个数
            //从正左开始的8个方向
                arr = T.fGetAround(X, Y), i = arr.length, TAr;
            while (i--) {
                //TX,TY获得本格周围的坐标
                (ObTXTY = T.fGetMine(TX = (TAr = arr[i])[0], TY = TAr[1])).Mine == 1 && ++countMine;
                !ObTXTY.State && aTmpClear.push([TX, TY]);
            }
            ObXY = T.fGetMine(X, Y);
            ObXY.MineCount = countMine;
            srcEle.className = 'M' + countMine;
            if (!countMine) {
                Array.prototype.push.apply(T.aClear, aTmpClear);
                i = aTmpClear.length;
                while (i--)T.fGetMine((TAr = aTmpClear[i])[0], TAr[1]).State = 1;
            } else {
                getOs() == 2 ?
                    srcEle.textContent = countMine
                    : srcEle.innerText = countMine
            }
            T.fClearMine();
        },

        //获得双键辅助开启
        fOpenFlagMine: function (X, Y) {
            var T = this, FlagCount = 0, TX, TY, ObXY, ObTXTY, aTmpClear = [], FlagErr = false,
                arr = T.fGetAround(X, Y), i = arr.length, TAr;
            while (i--) {
                //TX,TY获得本格周围的坐标
                ObTXTY = T.fGetMine(TX = (TAr = arr[i])[0], TY = TAr[1]);
                switch (ObTXTY.State) {
                    case 0: //未开启未标记
                        !ObTXTY.Mine && aTmpClear.push([TX, TY]); //没雷也没旗子的时候加入到被辅助开启的数组}
                        break;
                    case 2: //标记了旗子
                        ++FlagCount; //只要标记了旗子,无论对错,都记录标记数+1
                        !ObTXTY.Mine && (FlagErr = true); //没有雷但是标记了旗子,标记错误
                }
            }
            if (FlagCount < T.fGetMine(X, Y).MineCount || aTmpClear.length == 0)return;
            //旗子比实际雷少,无论标记对错,不开启
            //没有可以提供开启的空格
            if (FlagErr) { //有错误则进行结束游戏处理
                T.fFail();
                return;
            }
            Array.prototype.push.apply(T.aClear, aTmpClear);
            i = aTmpClear.length;
            while (i--)T.fGetMine((TAr = aTmpClear[i])[0], TAr[1]).State = 1;
            T.fClearMine();
        },

        //显示所有的雷
        fShowMine: function () {
            var T = this, X = 0, Y = T.MaxY, MaxX = T.MaxX, Mine = T.Mine, TAr, TArX;
            while (Y--) {
                X = MaxX;
                TAr = Mine[Y];
                while (X--) {
                    TArX = TAr[X];
                    switch (TArX.Mine) {
                        case 0:
                            TArX.State == 2 && ($('Img' + X + '_' + Y).className = 'ErrFlag');
                            break;
                        case 1:
                            $('Img' + X + '_' + Y).className = 'Mine';
                    }
                }
            }
        },

        //游戏成功结束
        fSuccess: function () {
            this.Success = true;
            $('btnRefreshMap').src = 'success.gif';
        },

        //游戏失败结束
        fFail: function () {
            this.GameOver = true;
            $('btnRefreshMap').src = 'sad.gif';
            this.fShowMine();
        }
    },

//换地图
    ChangeMap = function (Map) {
        var O = OMine;
        switch (Map) {
            case 1:
                O.MaxX = O.MaxY = 9;
                O.MineCount = 10;
                break;
            case 2:
                O.MaxX = O.MaxY = 16;
                O.MineCount = 40;
                break;
            case 3:
                O.MaxX = 30;
                O.MaxY = 16;
                O.MineCount = 99;
        }
        O.fInit();
    },

    getOs = function () {
        if (navigator.userAgent.indexOf("MSIE") > 0)return 1;
        if (isFirefox = navigator.userAgent.indexOf("Firefox") > 0)return 2;
        if (isSafari = navigator.userAgent.indexOf("Safari") > 0)return 3;
        if (isCamino = navigator.userAgent.indexOf("Camino") > 0)return 4;
        if (isMozilla = navigator.userAgent.indexOf("Gecko/") > 0)return 5;
        return 0;
    };


FlagImg.src = 'flag.gif';
HappyImg.src = 'happy.gif';
MineImg.src = 'mine.gif';
SadImg.src = 'sad.gif';
SuccessImg.src = 'success.gif';


///**
// * Created by wanlu on 2015/7/7.
// */
//
//$(document).ready(function () {
//
//        //定义雷
//        //(初级为9*9个方块10个雷，中级为16*16个方块40个雷，高级为16*30个方块99个雷)
//        var row = 16;
//        var col = 30;
//        var count = 99;
//        var mines = Array();
//        for (var i = 0; i < row + 2; i++) {
//            mines[i] = new Array();
//            for (var j = 0; j < col + 2; j++) {
//                mines[i][j] = {ismine: false, minecount: 0, isflag: false};
//                //console.log(mines[i][j].ismine);
//            }
//        }
//
//        setmine();
//        getcount();
//
//        //随机设置99个雷
//        function setmine() {
//            var x, y;
//            var i = 0;
//            while (i < count) {
//                x = getrandom(row);
//                y = getrandom(col);
//                if (mines[x][y].ismine) {
//                    continue;
//                }
//                mines[x][y].ismine = true;
//                i++;
//            }
//        }
//
//        //获得单元周围雷的个数
//        function getcount() {
//            for (var i = 1; i < row + 1; i++) {
//                for (var j = 1; j < col + 1; j++) {
//                    for (var k = i - 1; k <= i + 1; k++)
//                        for (var m = j - 1; m <= j + 1; m++)
//                            mines[i][j].minecount += mines[k][m].ismine;
//                    mines[i][j].minecount -= mines[i][j].ismine;
//                }
//            }
//        }
//
//        function getrandom(num) {
//            return Math.floor(num * Math.random()) + 1;
//        }
//
//        //在网页
//        for (var i = 1; i < row + 1; i++) {
//            var id_row;
//            if (i < 10) id_row = "row_0" + i;
//            else  id_row = "row_" + i;
//            $('#mines_area').append("<tr id=" + id_row + "></tr>")
//            for (var j = 1; j < col + 1; j++) {
//                var id_cell;
//                if (i < 10)id_cell = "cell_0" + i + "_" + j;
//                else id_cell = "cell_" + i + "_" + j;
//                $('#' + id_row).append("<td id=" + id_cell + " class='mine'></td>")
//
//            }
//        }
//
//        $('.mine').contextmenu(function (e) {
//            return false;
//        })
//
//        $('.mine').mousedown(function (event) {
//
//
//            console.log(id);
//            var x = id.substr();
//            var y = id.substr();
//
//            if (event.which == 1) {
//                if (mines[x][y].ismine)alert('游戏失败')
//                else $(this).html(mines[x][y].minecount)
//                //console.log('鼠标左击');
//            }
//
//            else if (event.which == 3) {
//                //console.log('鼠标右击');
//                if (mines[x][y].isflag) {
//                    $(this).removeClass('flag');
//                    mines[x][y].isflag = false;
//                }
//                else {
//                    $(this).addClass('flag');
//                    mines[x][y].isflag = true;
//                }
//                console.log('i=' + x + ', j=' + y);
//                //console.log('mines[' + (i - 1) + '][' + j + ']=' + mines[i - 1][j].isflag)
//            }
//
//            return false;
//        })
//        //$(".mine").mousedown(function (event) {
//        //    if (event.which == 1) {
//        //
//        //        //console.log('鼠标左击');
//        //    }
//        //    else if (event.which == 3) {
//        //        console.log('鼠标右击');
//        //    }
//        //    return false;
//        //})
//    }
//)
