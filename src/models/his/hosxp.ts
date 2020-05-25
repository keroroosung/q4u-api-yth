import * as knex from 'knex';

export class HosxpModel {

  testConnection(db: knex) {
    return db.raw(`select 'Q4U Work'`);
  }

  getPatientInfo(db: knex, cid: any) {
    return db('patient')
      .select('hn', 'fname as first_name', 'pname as title', 'sex', 'lname as last_name', 'birthday as birthdate')
      .where('cid', cid).limit(1);
  }

  getPatientInfoWithHN(db: knex, hn: any) {
    return db('patient')
      .select('hn','cid', 'fname as first_name', 'pname as title', 'sex', 'lname as last_name', 'birthday as birthdate')
      .where('hn', hn).limit(1);
  }

getCurrentVisit(db: knex, hn) {
    return db('vn_stat as v')
      .select('v.vstdate', 'o.vsttime', 'v.hn', 'p.pname as title', 'p.fname as first_name', 'p.lname as last_name')
      .leftJoin('ovst as o', 'o.vn', 'v.vn')
      .leftJoin('spclty as s', 's.spclty', 'v.spclty')
      .leftJoin('kskdepartment as k', 'k.depcode', 'o.cur_dep')
      .leftJoin('patient as p', 'p.hn', 'v.hn')
      .whereRaw('v.vstdate = CURDATE()')
      .where('v.hn', hn);
  }
  
  getHISQueue(db: knex, hn: any, dateServ: any) {
    return db('ovst as o')
      .select(db.raw('concat(k.display_text,o.oqueue) as queue'))
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.main_dep')
      .where('o.hn', hn)
      .where('o.vstdate', dateServ)
      .orderBy('o.vn', 'DESC')
      .limit(1)
  }

  getHISWaitQueue(db: knex,dateServ: any,servicePointId: any,currentQueue: any,query: any){
    const sql = `SELECT o.oqueue as queue_number,"3.5" as timeavg from ovst o 
    INNER JOIN kskdepartment k on o.cur_dep = k.depcode
    WHERE o.vstdate=? and k.opd_qs_room_id=? and o.oqueue > ? 
    ORDER BY o.oqueue limit 7`;
    return db.raw(sql, [dateServ,servicePointId,currentQueue]);
  }

  getVisitList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    var sql = db('ovst as o')
      .select('o.vn', 'o.hn', db.raw('o.vstdate as date_serv'), db.raw('o.vsttime as time_serv'),
      'k.opd_qs_room_id as clinic_code', 'k.department as clinic_name',
        'pt.pname as title', 'pt.fname as first_name', 'pt.lname as last_name',
        'pt.birthday as birthdate', 'pt.sex as sex', 'o.main_dep_queue as his_queue')
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.main_dep')
      .where('o.vstdate', dateServ)
      .whereIn('k.opd_qs_room_id', localCode)
      .whereNotIn('o.vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('o.hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('pt.fname', 'like', firstName).where('pt.lname', 'like', lastName))
        }
        return _where;
      });
    } else {
      if (servicePointCode) {
        sql.where('k.opd_qs_room_id', servicePointCode);
      }
    }

    return sql.limit(limit)
      .offset(offset)
      .orderBy('o.vsttime', 'asc');

  }

  getVisitTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    var sql = db('ovst as o')
      .select(db.raw('count(*) as total'))
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.main_dep')
      .where('o.vstdate', dateServ)
      .whereIn('k.opd_qs_room_id', localCode)
      .whereNotIn('o.vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('o.hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('pt.fname', 'like', firstName).where('pt.lname', 'like', lastName))
        }
        return _where;
      });
    } else {
      if (servicePointCode) {
        sql.where('k.opd_qs_room_id', servicePointCode);
      }
    }

    return sql;
  }

  getVisitHistoryList(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any, limit: number = 20, offset: number = 0) {
    var sql = db('ovst as o')
      .select('o.vn', 'o.hn', db.raw('o.vstdate as date_serv'), db.raw('o.vsttime as time_serv'),
        'o.main_dep as clinic_code', 'k.department as clinic_name',
        'pt.pname as title', 'pt.fname as first_name', 'pt.lname as last_name',
        'pt.birthday as birthdate', 'pt.sex as sex', 'o.main_dep_queue as his_queue')
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.main_dep')
      .where('o.vstdate', dateServ)
      .whereIn('k.opd_qs_room_id', localCode)
      .whereIn('o.vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('o.hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('pt.fname', 'like', firstName).where('pt.lname', 'like', lastName))
        }
        return _where;
      });
    } else {
      if (servicePointCode) {
        sql.where('k.opd_qs_room_id', servicePointCode);
      }
    }

    return sql.limit(limit)
      .offset(offset)
      .orderBy('o.vsttime', 'asc');

  }

  getVisitHistoryTotal(db: knex, dateServ: any, localCode: any[], vn: any[], servicePointCode: any, query: any) {
    var sql = db('ovst as o')
      .select(db.raw('count(*) as total'))
      .innerJoin('patient as pt', 'pt.hn', 'o.hn')
      .innerJoin('kskdepartment as k', 'k.depcode', 'o.main_dep')
      .where('o.vstdate', dateServ)
      .whereIn('k.opd_qs_room_id', localCode)
      .whereIn('o.vn', vn);

    if (query) {
      var _arrQuery = query.split(' ');
      var firstName = null;
      var lastName = null;

      if (_arrQuery.length === 2) {
        firstName = `${_arrQuery[0]}%`;
        lastName = `${_arrQuery[1]}%`;
      }

      sql.where(w => {
        var _where = w.where('o.hn', query);
        if (firstName && lastName) {
          _where.orWhere(x => x.where('pt.fname', 'like', firstName).where('pt.lname', 'like', lastName))
        }
        return _where;
      });
    } else {
      if (servicePointCode) {
        sql.where('k.opd_qs_room_id', servicePointCode);
      }
    }

    return sql;
  }
}
