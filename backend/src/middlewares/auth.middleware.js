import { supabaseAdmin } from '../services/supabase.service.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        message: 'Missing Authorization header'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid Authorization format'
      });
    }

    // Validar token con Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid or expired token'
      });
    }

    // Inyectamos usuario en la request
    req.user = {
      id: data.user.id,
      email: data.user.email,
      provider: data.user.app_metadata?.provider
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      ok: false,
      message: 'Authentication error'
    });
  }
};
