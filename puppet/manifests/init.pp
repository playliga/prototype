exec { 'apt_update':
  command => 'apt-get update',
  path    => '/usr/bin'
}

# set global path variable for project
# http://www.puppetcookbook.com/posts/set-global-exec-path.html
Exec { path => [ "/bin/", "/sbin/" , "/usr/bin/", "/usr/sbin/", "/usr/local/bin", "/usr/local/sbin" ] }

# set the last staging that rvm install will run in
stage { 'install-rvm': }
Stage['main'] -> Stage['install-rvm']

# run dem jawns
class { 'git::install': }
class { 'mysql::install': }
class { 'rvm::install':
	stage => install-rvm
}
